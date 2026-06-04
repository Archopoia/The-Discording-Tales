/**
 * Copy GM chat vendor scripts (marked, DOMPurify) for lazy Play-tab loading.
 * Usage: node tools/copy_play_vendors.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'js', 'vendor');

const vendors = [
    { from: 'node_modules/marked/marked.min.js', to: 'marked.min.js' },
    { from: 'node_modules/dompurify/dist/purify.min.js', to: 'purify.min.js' },
];

fs.mkdirSync(outDir, { recursive: true });

for (const v of vendors) {
    const src = path.join(root, v.from);
    const dest = path.join(outDir, v.to);
    if (!fs.existsSync(src)) {
        console.error('Missing vendor file:', v.from, '(run npm install)');
        process.exit(1);
    }
    fs.copyFileSync(src, dest);
    const kb = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log('Copied', path.relative(root, dest), `(${kb} KB)`);
}
