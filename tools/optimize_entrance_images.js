/**
 * Progressive image pipeline for live-referenced heavy assets.
 *
 * Scans templates + landing JSON + key CSS, then for each image >= MIN_KB:
 *   - <stem>_medium.webp  (max 1200px)
 *   - <stem>_lqip.webp    (32px)
 * Writes public/data/progressive-images.json for runtime auto-wiring.
 *
 * Usage: node tools/optimize_entrance_images.js
 * Also: npm run build:images
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(root, 'assets', 'images');
const MANIFEST_PATH = path.join(root, 'public', 'data', 'progressive-images.json');

let sharp;
try {
    sharp = (await import('sharp')).default;
} catch {
    console.error('Error: sharp is not installed. Run: npm install');
    process.exit(1);
}

const MEDIUM_WIDTH = 1200;
const LQIP_WIDTH = 32;
const MIN_KB = 80;
const QUALITY_FULLish = 82;
const QUALITY_MEDIUM = 78;
const QUALITY_LQIP = 20;

/** Always include these even if under the size floor (critical path). */
const ALWAYS = [
    'assets/images/Map_Naked.webp',
    'assets/images/Creusalité_NoBorders.webp',
    'assets/images/geocosmos-plain.webp',
    'assets/images/image/image1.webp',
];

const SCAN_FILES = [
    'index.template.html',
    'landing.template.html',
    'scene-lab.template.html',
    'public/data/landing-carousels.json',
    'public/data/landing-cinema.json',
    'css/_variables.css',
    'css/_components.css',
    'css/_sections.css',
    'css/_keyhole.css',
];

/** Match asset paths; allow spaces (JSON) and %20 (HTML). */
const ASSET_RE = /assets\/images\/(?:[^"'<>)\]])+?\.(?:webp|jpg|jpeg|png)/gi;

function fmtKB(bytes) {
    return (bytes / 1024).toFixed(1) + ' KB';
}

function decodeAsset(raw) {
    let p = raw.replace(/\\/g, '/');
    try {
        p = decodeURIComponent(p);
    } catch {
        /* keep */
    }
    return p;
}

function isVariant(rel) {
    return /_(lqip|medium)\.webp$/i.test(rel);
}

function collectReferenced() {
    const set = new Set(ALWAYS);
    for (const rel of SCAN_FILES) {
        const abs = path.join(root, rel);
        if (!fs.existsSync(abs)) continue;
        const text = fs.readFileSync(abs, 'utf8');
        let m;
        ASSET_RE.lastIndex = 0;
        while ((m = ASSET_RE.exec(text))) {
            const p = decodeAsset(m[0]);
            if (isVariant(p)) continue;
            set.add(p);
        }
    }

    // Scene-lab loads many Scene/*.webp via JS string literals in the template.
    const sceneDir = path.join(ASSETS_DIR, 'Scene');
    if (fs.existsSync(sceneDir)) {
        for (const name of fs.readdirSync(sceneDir)) {
            if (!/\.webp$/i.test(name) || isVariant(name)) continue;
            if (name.startsWith('Scene_') || ['Yums.webp', 'Yors.webp', 'Beingsts.webp'].includes(name)) {
                set.add('assets/images/Scene/' + name);
            }
        }
        const lighter = path.join(sceneDir, 'Lighter');
        if (fs.existsSync(lighter)) {
            for (const name of fs.readdirSync(lighter)) {
                if (!/\.webp$/i.test(name) || isVariant(name)) continue;
                set.add('assets/images/Scene/Lighter/' + name);
            }
        }
    }

    return [...set];
}

function variantPaths(rel) {
    const dir = path.posix.dirname(rel);
    const base = path.posix.basename(rel);
    const stem = base.replace(/\.(webp|jpg|jpeg|png)$/i, '');
    const isRaster = /\.(jpg|jpeg|png)$/i.test(base);
    return {
        stem,
        medium: `${dir}/${stem}_medium.webp`,
        lqip: `${dir}/${stem}_lqip.webp`,
        // Always serve WebP on the wire; keep original path only if already webp.
        full: isRaster ? `${dir}/${stem}.webp` : rel,
        source: rel,
    };
}

async function generateVariant(srcAbs, outAbs, width, quality) {
    await sharp(srcAbs)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(outAbs);
    return fs.statSync(outAbs).size;
}

async function main() {
    console.log('Scanning live image references…\n');
    const refs = collectReferenced();
    /** @type {Record<string, { lqip: string, medium: string, full: string }>} */
    const manifest = {};
    let processed = 0;
    let skipped = 0;

    for (const rel of refs.sort()) {
        const abs = path.join(root, rel.replace(/\//g, path.sep));
        if (!fs.existsSync(abs)) {
            console.warn('  skip missing:', rel);
            skipped++;
            continue;
        }
        const size = fs.statSync(abs).size;
        const kb = size / 1024;
        if (kb < MIN_KB && !ALWAYS.includes(rel)) {
            skipped++;
            continue;
        }

        const v = variantPaths(rel);
        const outDir = path.join(root, path.posix.dirname(v.medium).replace(/\//g, path.sep));
        fs.mkdirSync(outDir, { recursive: true });

        console.log(`  📷  ${rel} (${fmtKB(size)})`);
        try {
            const medBytes = await generateVariant(
                abs,
                path.join(root, v.medium.replace(/\//g, path.sep)),
                MEDIUM_WIDTH,
                QUALITY_MEDIUM,
            );
            const lqipBytes = await generateVariant(
                abs,
                path.join(root, v.lqip.replace(/\//g, path.sep)),
                LQIP_WIDTH,
                QUALITY_LQIP,
            );
            let fullRel = v.full;
            let fullNote = 'kept';
            if (fullRel !== rel) {
                const fullAbs = path.join(root, fullRel.replace(/\//g, path.sep));
                const fullBytes = await sharp(abs)
                    .webp({ quality: QUALITY_FULLish })
                    .toFile(fullAbs)
                    .then(() => fs.statSync(fullAbs).size);
                fullNote = `webp ${fmtKB(fullBytes)}`;
            }
            console.log(`      medium ${fmtKB(medBytes)}  |  lqip ${fmtKB(lqipBytes)}  |  full ${fullNote}`);
            const entry = { lqip: v.lqip, medium: v.medium, full: fullRel };
            manifest[rel] = entry;
            if (fullRel !== rel) manifest[fullRel] = entry;
            // Also index URL-encoded form used in some HTML attrs
            const encoded = rel.split('/').map(encodeURIComponent).join('/').replace(/%2F/gi, '/');
            if (encoded !== rel) manifest[encoded] = entry;
            processed++;
        } catch (err) {
            console.error(`  ❌  ${rel}: ${err.message}`);
        }
    }

    // Display-sized WebP for critical logos shown tiny but stored huge
    const logoTargets = [
        { src: 'assets/images/image/image2.png', out: 'assets/images/image/image2_display.webp', width: 320 },
        { src: 'assets/images/image/image12.png', out: 'assets/images/image/image12_display.webp', width: 320 },
    ];
    for (const logo of logoTargets) {
        const abs = path.join(root, logo.src.replace(/\//g, path.sep));
        if (!fs.existsSync(abs)) continue;
        const outAbs = path.join(root, logo.out.replace(/\//g, path.sep));
        const bytes = await generateVariant(abs, outAbs, logo.width, QUALITY_FULLish);
        console.log(`  🎞  display ${logo.out} (${fmtKB(bytes)}) from ${path.basename(logo.src)}`);
        manifest[logo.src] = {
            lqip: variantPaths(logo.src).lqip,
            medium: logo.out,
            full: logo.out, // never pull the multi-hundred-KB PNG on the critical path
        };
    }

    fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`\nDone. Processed ${processed} heavies (${skipped} skipped).`);
    console.log('Manifest:', path.relative(root, MANIFEST_PATH), `(${Object.keys(manifest).length} keys)`);
}

main();
