/**
 * Bundle main-site CSS: resolve @imports in css/dtd-website.css and write dist/main-site.css.
 * Usage: node tools/build_css.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const cssDir = path.join(root, 'css');
const mainCssPath = path.join(cssDir, 'dtd-website.css');
const outDir = path.join(root, 'dist');
const outPath = path.join(outDir, 'main-site.css');

const mainCss = fs.readFileSync(mainCssPath, 'utf8');
const importRe = /@import\s+"([^"]+)";/g;
let match;
const parts = [];

while ((match = importRe.exec(mainCss)) !== null) {
  const partialPath = path.join(cssDir, match[1]);
  parts.push(fs.readFileSync(partialPath, 'utf8'));
}

let out = parts.join('\n\n');
// Optional: strip /* ... */ comments and collapse multiple blanks/newlines
out = out.replace(/\/\*[\s\S]*?\*\//g, '');
out = out.replace(/\n\s*\n\s*\n/g, '\n\n');
out = out.replace(/[ \t]+\n/g, '\n');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(outPath, out.trimEnd() + '\n', 'utf8');
console.log('Built dist/main-site.css from css/dtd-website.css and partials');
