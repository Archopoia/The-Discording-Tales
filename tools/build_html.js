/**
 * HTML partials build: replace {{peoples-cards}}, {{inspirations-keywords}},
 * {{universe-lore-fr}}, {{zine-content}}, {{about-contact-quest}} with partials files.
 * Injects {{SITE_PUBLIC_BASE}} from tools/site-public-url.js (SITE_PUBLIC_URL env).
 * Builds 404.html from 404.template.html with the same base.
 *
 * Usage:
 *   node tools/build_html.js           -  build index.html from index.template.html + partials
 *   node tools/build_html.js --init   -  extract partials from index.html and create index.template.html (one-time)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSitePublicBase } from './site-public-url.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const ogMetaPath = path.join(root, 'tools', '.og-assets-meta.json');

/** @returns {{ primary: string; cacheQuery: string; alt: string; orgLogo: string }} */
function loadOgMeta() {
  const fallback = {
    primary: 'assets/og-tdt-1200x630.jpg',
    cacheQuery: '',
    alt: 'THE DISCORDING TALES - An ethno-science-fantasy gameworld',
    orgLogo: 'assets/og/tdt-brand-square-512.jpg',
  };
  if (!fs.existsSync(ogMetaPath)) {
    console.warn('Missing tools/.og-assets-meta.json - run: npm run build:og');
    return fallback;
  }
  return { ...fallback, ...JSON.parse(fs.readFileSync(ogMetaPath, 'utf8')) };
}
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
  const universeLorePath = path.join(partialsDir, 'universe-lore-fr.html');
  const aboutQuestPath = path.join(partialsDir, 'about-contact-quest.html');
  const peoples = fs.readFileSync(peoplesPath, 'utf8');
  const keywords = fs.readFileSync(keywordsPath, 'utf8');
  const zineContent = fs.existsSync(zinePath) ? fs.readFileSync(zinePath, 'utf8') : '<!-- Run build_zine.js to generate zine-content -->';
  const universeLoreFr = fs.existsSync(universeLorePath)
    ? fs.readFileSync(universeLorePath, 'utf8')
    : '<!-- missing partials/universe-lore-fr.html -->';
  const aboutContactQuest = fs.existsSync(aboutQuestPath)
    ? fs.readFileSync(aboutQuestPath, 'utf8')
    : '<!-- missing partials/about-contact-quest.html -->';
  let out = template
    .replace('{{peoples-cards}}', peoples.trim())
    .replace('{{inspirations-keywords}}', keywords.trim())
    .replace('{{universe-lore-fr}}', universeLoreFr.trim())
    .replace('{{zine-content}}', zineContent.trim())
    .replace('{{about-contact-quest}}', aboutContactQuest.trim());
  const base = getSitePublicBase();
  const og = loadOgMeta();
  const ogImagePath = `${og.primary}${og.cacheQuery}`;
  const orgLogoPath = `${og.orgLogo}${og.cacheQuery}`;
  out = out
    .replaceAll('{{SITE_PUBLIC_BASE}}', base)
    .replaceAll('{{OG_IMAGE_PATH}}', ogImagePath)
    .replaceAll('{{OG_IMAGE_ALT}}', og.alt)
    .replaceAll('{{ORG_LOGO_PATH}}', orgLogoPath);
  fs.writeFileSync(indexPath, out, 'utf8');
  console.log('Built index.html from template + partials');

  const fourTemplatePath = path.join(root, '404.template.html');
  const fourOutPath = path.join(root, '404.html');
  if (fs.existsSync(fourTemplatePath)) {
    const four = fs.readFileSync(fourTemplatePath, 'utf8').replaceAll('{{SITE_PUBLIC_BASE}}', base);
    fs.writeFileSync(fourOutPath, four, 'utf8');
    console.log('Built 404.html from 404.template.html');
  }
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
