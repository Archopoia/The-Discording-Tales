/**
 * Convert landing carousel PNG/JPG assets to WebP and update public/data/landing-carousels.json.
 * Usage: node tools/optimize_carousel_images.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let sharp;
try {
    sharp = (await import('sharp')).default;
} catch {
    console.error('Error: sharp is not installed. Run: npm install');
    process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'public', 'data', 'landing-carousels.json');
const carousel = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function fmtKB(bytes) {
    return (bytes / 1024).toFixed(1) + ' KB';
}

function decodeSrc(src) {
    try {
        return decodeURIComponent(src);
    } catch {
        return src;
    }
}

async function toWebpIfNeeded(src) {
    const decoded = decodeSrc(src);
    if (!/\.(png|jpe?g)$/i.test(decoded)) {
        return src;
    }

    const abs = path.join(root, decoded.replace(/\//g, path.sep));
    if (!fs.existsSync(abs)) {
        console.warn('  skip (missing):', decoded);
        return src;
    }

    const webpRel = decoded.replace(/\.(png|jpe?g)$/i, '.webp');
    const webpAbs = path.join(root, webpRel.replace(/\//g, path.sep));

    const srcSize = fs.statSync(abs).size;
    await sharp(abs).webp({ quality: 82 }).toFile(webpAbs);
    const webpSize = fs.statSync(webpAbs).size;
    const savings = ((1 - webpSize / srcSize) * 100).toFixed(0);
    console.log(`  ${path.basename(decoded)} → ${path.basename(webpRel)} (${fmtKB(srcSize)} → ${fmtKB(webpSize)}, -${savings}%)`);

    return webpRel.split(path.sep).join('/');
}

console.log('Optimizing landing carousel images…\n');

for (const key of ['lifestyles', 'meanings', 'stories']) {
    const items = carousel[key];
    if (!Array.isArray(items)) continue;
    console.log(key + ':');
    for (let i = 0; i < items.length; i++) {
        items[i].src = await toWebpIfNeeded(items[i].src);
    }
    console.log('');
}

fs.writeFileSync(jsonPath, JSON.stringify(carousel, null, 2) + '\n', 'utf8');
console.log('Updated', path.relative(root, jsonPath));
