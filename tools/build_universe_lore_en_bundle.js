/**
 * Merges public/data/universe-lore-en/*.json into universe-lore-en.json for bundling.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'public', 'data', 'universe-lore-en');
const out = path.join(__dirname, '..', 'public', 'data', 'universe-lore-en.json');

const entries = {};
for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.json')) continue;
    const id = file.replace(/\.json$/, '');
    entries[id] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
}

fs.writeFileSync(out, JSON.stringify({ entries }, null, 2) + '\n', 'utf8');
console.log('Wrote', out, '-', Object.keys(entries).length, 'entries');
