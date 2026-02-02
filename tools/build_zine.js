/**
 * Build zine HTML from ZINE_Regles_De_Base_10_Pages.md.
 * Writes partials/zine-content.html for injection into index.template.html.
 *
 * Usage: node tools/build_zine.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const zineMdPath = path.join(root, 'reference', 'TTRPG_DRD', 'System_Summary', 'ZINE_Regles_De_Base_10_Pages.md');
const partialsDir = path.join(root, 'partials');
const outPath = path.join(partialsDir, 'zine-content.html');

marked.setOptions({ gfm: true, breaks: true });

const PAGE_LABELS = ['Intro', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Fin'];

function build() {
  const md = fs.readFileSync(zineMdPath, 'utf8');
  const blocks = md.split(/\n---\n/).filter(Boolean);
  const navItems = blocks.map((_, i) => {
    const label = PAGE_LABELS[i] != null ? PAGE_LABELS[i] : String(i + 1);
    const checked = i === 0 ? ' checked' : '';
    return `<input type="radio" name="zine-page" id="zine-page-radio-${i}" value="${i}" class="zine-page-radio"${checked} aria-controls="zine-page-${i}"/><label for="zine-page-radio-${i}" class="zine-page-nav-label">${label}</label>`;
  }).join('\n');
  const nav = `<nav class="zine-pages-nav" role="tablist" aria-label="Zine pages">\n${navItems}\n</nav>`;
  const sections = blocks.map((block, i) => {
    const trimmed = block.trim();
    const html = marked.parse(trimmed);
    const activeClass = i === 0 ? ' zine-page-active' : '';
    return `<section id="zine-page-${i}" class="zine-page zine-page-panel${activeClass}" data-page="${i}" role="tabpanel" aria-labelledby="zine-page-radio-${i}">${html}</section>`;
  });
  const wrapped = `<div class="zine-content tdt-scrollable">\n${nav}\n<div class="zine-pages-container">\n${sections.join('\n')}\n</div>\n</div>`;
  if (!fs.existsSync(partialsDir)) {
    fs.mkdirSync(partialsDir, { recursive: true });
  }
  fs.writeFileSync(outPath, wrapped, 'utf8');
  console.log('Built partials/zine-content.html from ZINE_Regles_De_Base_10_Pages.md');
}

build();
