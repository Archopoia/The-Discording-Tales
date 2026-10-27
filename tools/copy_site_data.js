/**
 * Copy large JSON manifests into dist/data for runtime fetch
 * (keeps them out of the initial main-site.js parse).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'public', 'data');
const outDir = path.join(root, 'dist', 'data');
const files = ['attributes-tree.json', 'universe-lore-en.json'];

fs.mkdirSync(outDir, { recursive: true });
for (const name of files) {
    const from = path.join(srcDir, name);
    const to = path.join(outDir, name);
    if (!fs.existsSync(from)) {
        console.warn('[copy_site_data] missing', from);
        continue;
    }
    fs.copyFileSync(from, to);
    console.log('[copy_site_data]', name, '-> dist/data/');
}
