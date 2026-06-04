/**
 * Optimize entrance images for faster loading.
 * Generates WebP versions, LQIP (Low Quality Image Placeholders), and
 * medium-resolution responsive variants of entrance-critical images.
 *
 * Usage: node tools/optimize_entrance_images.js
 *
 * Requires: npm install sharp --save-dev
 *
 * Generates for each source image:
 *   - <name>.webp              – full-quality WebP (same dimensions)
 *   - <name>_medium.webp       – medium-res WebP  (max 1200px wide)
 *   - <name>_lqip.webp         – tiny placeholder  (32px wide, very low quality)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import for sharp (handles if not installed)
let sharp;
try {
    sharp = (await import('sharp')).default;
} catch (e) {
    console.error('Error: sharp is not installed.');
    console.error('Run: npm install sharp --save-dev');
    process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');

// Width thresholds for responsive variants
const MEDIUM_WIDTH  = 1200;   // Good for most 1080p screens
const LQIP_WIDTH    = 32;     // Tiny placeholder (< 1 KB)

const ENTRANCE_IMAGES = [
    { src: 'Map_Naked.webp',               baseName: 'Map_Naked',               quality: 85 },
    { src: 'Creusalité_NoBorders.webp',    baseName: 'Creusalité_NoBorders',    quality: 90 },
];

/** Pretty-print file size. */
function fmtKB(bytes) { return (bytes / 1024).toFixed(1) + ' KB'; }

async function generateVariant(srcPath, outPath, width, quality, label) {
    await sharp(srcPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(outPath);
    const stats = fs.statSync(outPath);
    console.log(`      ${label}: ${path.basename(outPath)} (${fmtKB(stats.size)})`);
}

async function optimizeImages() {
    console.log('Optimizing entrance images…\n');

    for (const img of ENTRANCE_IMAGES) {
        const srcPath = path.join(ASSETS_DIR, img.src);

        if (!fs.existsSync(srcPath)) {
            console.warn(`  ⏭  Skipping: ${img.src} (file not found)`);
            continue;
        }

        const srcStats = fs.statSync(srcPath);
        console.log(`  📷  ${img.src} (${fmtKB(srcStats.size)})`);

        try {
            const webpPath = path.join(ASSETS_DIR, `${img.baseName}.webp`);
            const srcIsWebp = img.src.toLowerCase().endsWith('.webp');

            // 1. Full-quality WebP (skip if source is already the target webp)
            if (!srcIsWebp || path.resolve(srcPath) !== path.resolve(webpPath)) {
                await sharp(srcPath)
                    .webp({ quality: img.quality })
                    .toFile(webpPath);
                const webpStats = fs.statSync(webpPath);
                const savings = ((1 - webpStats.size / srcStats.size) * 100).toFixed(1);
                console.log(`      Full WebP : ${img.baseName}.webp (${fmtKB(webpStats.size)}, ${savings}% smaller)`);
            } else {
                console.log(`      Full WebP : ${img.baseName}.webp (already present)`);
            }

            // 2. Medium-resolution WebP (max 1200px wide)
            await generateVariant(
                srcPath,
                path.join(ASSETS_DIR, `${img.baseName}_medium.webp`),
                MEDIUM_WIDTH,
                Math.min(img.quality, 80),
                'Medium   '
            );

            // 3. LQIP – tiny placeholder (32px wide, quality 20)
            await generateVariant(
                srcPath,
                path.join(ASSETS_DIR, `${img.baseName}_lqip.webp`),
                LQIP_WIDTH,
                20,
                'LQIP     '
            );

            console.log('');
        } catch (err) {
            console.error(`  ❌  Error processing ${img.src}: ${err.message}`);
        }
    }

    console.log('Done! Generated files:');
    console.log('  • *.webp         – Full-quality WebP (used by CSS image-set)');
    console.log('  • *_medium.webp  – Medium-res (~1200px) for faster initial load');
    console.log('  • *_lqip.webp    – Tiny placeholder (~32px) for instant blur preview');
    console.log('\nThe CSS + JS progressive loading system will automatically');
    console.log('use the LQIP → medium → full chain when these files exist.');
}

optimizeImages();
