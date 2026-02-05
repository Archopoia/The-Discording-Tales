/**
 * Optimize entrance images for faster loading.
 * Generates WebP versions of the entrance-critical images.
 * 
 * Usage: node tools/optimize_entrance_images.js
 * 
 * Requires: npm install sharp --save-dev
 * 
 * Generates:
 *   - assets/images/Map_Naked.webp
 *   - assets/images/Creusalité_NoBorders.webp
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

const ENTRANCE_IMAGES = [
    { src: 'Map_Naked.jpg', webp: 'Map_Naked.webp', quality: 85 },
    { src: 'Creusalité_NoBorders.png', webp: 'Creusalité_NoBorders.webp', quality: 90 },
];

async function optimizeImages() {
    console.log('Optimizing entrance images...\n');
    
    for (const img of ENTRANCE_IMAGES) {
        const srcPath = path.join(ASSETS_DIR, img.src);
        const webpPath = path.join(ASSETS_DIR, img.webp);
        
        if (!fs.existsSync(srcPath)) {
            console.warn(`  Skipping: ${img.src} (file not found)`);
            continue;
        }
        
        try {
            const srcStats = fs.statSync(srcPath);
            
            await sharp(srcPath)
                .webp({ quality: img.quality })
                .toFile(webpPath);
            
            const webpStats = fs.statSync(webpPath);
            const savings = ((1 - webpStats.size / srcStats.size) * 100).toFixed(1);
            
            console.log(`  ${img.src}`);
            console.log(`    → ${img.webp} (${savings}% smaller)`);
            console.log(`    Original: ${(srcStats.size / 1024).toFixed(1)} KB`);
            console.log(`    WebP: ${(webpStats.size / 1024).toFixed(1)} KB\n`);
        } catch (err) {
            console.error(`  Error processing ${img.src}: ${err.message}`);
        }
    }
    
    console.log('Done! WebP images generated.');
    console.log('\nNote: CSS already supports image-set() with WebP fallback.');
    console.log('Modern browsers will use WebP, older browsers fall back to original format.');
}

optimizeImages();
