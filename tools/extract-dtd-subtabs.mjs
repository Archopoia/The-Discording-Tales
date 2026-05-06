import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const lines = fs.readFileSync(path.join(root, 'public/js/dtd-interactive.js'), 'utf8').split(/\r?\n/);

function strip(s) {
    return s
        .split('\n')
        .map((l) => l.replace(/^    /, ''))
        .join('\n');
}

const parts = [
    lines.slice(573, 608),
    lines.slice(639, 793),
    lines.slice(798, 853),
    lines.slice(857, 890),
];
const body = strip(parts.map((p) => p.join('\n')).join('\n\n'));
const head = `import { state } from './context';
import { setLanguage } from './language';
import { ARCHIVED_SUBTABS, FIRST_NON_ARCHIVED } from './archive-constants';

`;
const out = path.join(root, 'src/site/dtd/subtabs.ts');
fs.writeFileSync(out, head + body + '\n', 'utf8');
console.log('Wrote', out);
