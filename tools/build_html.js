/**
 * HTML partials build: replace {{peoples-cards}} and {{inspirations-keywords}}
 * with contents of partials/peoples-cards.html and partials/inspirations-keywords.html.
 *
 * Usage:
 *   node tools/build_html.js          — build index.html from index.template.html + partials
 *   node tools/build_html.js --init  — extract partials from index.html and create index.template.html (one-time)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const partialsDir = path.join(root, 'partials');
const templatePath = path.join(root, 'index.template.html');
const indexPath = path.join(root, 'index.html');

const PEOPLES_START = 287;   // 1-based, inclusive (<!-- Flip cards...)
const PEOPLES_END = 616;     // closing </div> of peoples-gallery
const KEYWORDS_START = 2241; // <details class="inspirations-expandable"> Keywords
const KEYWORDS_END = 2265;   // </details>

function build() {
  const template = fs.readFileSync(templatePath, 'utf8');
  const peoplesPath = path.join(partialsDir, 'peoples-cards.html');
  const keywordsPath = path.join(partialsDir, 'inspirations-keywords.html');
  const zinePath = path.join(partialsDir, 'zine-content.html');
  const peoples = fs.readFileSync(peoplesPath, 'utf8');
  const keywords = fs.readFileSync(keywordsPath, 'utf8');
  const zineContent = fs.existsSync(zinePath) ? fs.readFileSync(zinePath, 'utf8') : '<!-- Run build_zine.js to generate zine-content -->';
  let out = template
    .replace('{{peoples-cards}}', peoples.trim())
    .replace('{{inspirations-keywords}}', keywords.trim())
    .replace('{{zine-content}}', zineContent.trim());
  fs.writeFileSync(indexPath, out, 'utf8');
  console.log('Built index.html from template + partials');
}

function init() {
  const index = fs.readFileSync(indexPath, 'utf8');
  const lines = index.split('\n');
  if (!fs.existsSync(partialsDir)) {
    fs.mkdirSync(partialsDir, { recursive: true });
  }
  const peoplesBlock = lines.slice(PEOPLES_START - 1, PEOPLES_END).join('\n');
  const keywordsBlock = lines.slice(KEYWORDS_START - 1, KEYWORDS_END).join('\n');
  fs.writeFileSync(path.join(partialsDir, 'peoples-cards.html'), peoplesBlock.trimEnd() + '\n', 'utf8');
  fs.writeFileSync(path.join(partialsDir, 'inspirations-keywords.html'), keywordsBlock.trimEnd() + '\n', 'utf8');
  const beforePeoples = lines.slice(0, PEOPLES_START - 1).join('\n');
  const betweenBlocks = lines.slice(PEOPLES_END, KEYWORDS_START - 1).join('\n');
  const afterKeywords = lines.slice(KEYWORDS_END).join('\n');
  const templateContent = beforePeoples + '\n{{peoples-cards}}\n\n' + betweenBlocks + '\n{{inspirations-keywords}}\n\n' + afterKeywords;
  fs.writeFileSync(templatePath, templateContent, 'utf8');
  console.log('Created index.template.html and partials/peoples-cards.html, partials/inspirations-keywords.html');
  build();
}

const isInit = process.argv.includes('--init');
if (isInit) {
  init();
} else {
  build();
}
