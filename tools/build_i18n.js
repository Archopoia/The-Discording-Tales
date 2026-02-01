/**
 * i18n build: replace {{i18n:key}} placeholders in index.html with data-en/data-fr
 * from locales/en.json and locales/fr.json. Run after build_html.js.
 *
 * Placeholder format: {{i18n:key}} → data-en/data-fr; {{i18n-aria:key}}, {{i18n-alt:key}},
 * {{i18n-title:key}}, {{i18n-placeholder:key}}, {{i18n-tip:key}} for aria-label, alt, title, placeholder, tip.
 * Special: {{i18n:script-json}} → JSON string for page title/description (for setLanguage in JS).
 *
 * Usage:
 *   node tools/build_i18n.js   — run after build_html.js; reads and overwrites index.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const localesDir = path.join(root, 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

function escapeAttr(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function build() {
  const html = fs.readFileSync(indexPath, 'utf8');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

  let out = html;

  // Replace {{i18n:key}} with data-en="..." data-fr="..."
  const placeholderRe = /\{\{i18n:([a-zA-Z0-9_.]+)\}\}/g;
  out = out.replace(placeholderRe, (_, key) => {
    const enVal = en[key];
    const frVal = fr[key];
    if (enVal === undefined && frVal === undefined) return _;
    return `data-en="${escapeAttr(enVal ?? '')}" data-fr="${escapeAttr(frVal ?? '')}"`;
  });

  // Replace {{i18n-aria:key}} with data-aria-label-en="..." data-aria-label-fr="..."
  const ariaRe = /\{\{i18n-aria:([a-zA-Z0-9_.]+)\}\}/g;
  out = out.replace(ariaRe, (_, key) => {
    const enVal = en[key];
    const frVal = fr[key];
    if (enVal === undefined && frVal === undefined) return _;
    return `data-aria-label-en="${escapeAttr(enVal ?? '')}" data-aria-label-fr="${escapeAttr(frVal ?? '')}"`;
  });

  // Replace {{i18n-alt:key}} with data-alt-en="..." data-alt-fr="..."
  const altRe = /\{\{i18n-alt:([a-zA-Z0-9_.]+)\}\}/g;
  out = out.replace(altRe, (_, key) => {
    const enVal = en[key];
    const frVal = fr[key];
    if (enVal === undefined && frVal === undefined) return _;
    return `data-alt-en="${escapeAttr(enVal ?? '')}" data-alt-fr="${escapeAttr(frVal ?? '')}"`;
  });

  // Replace {{i18n-title:key}} with data-title-en="..." data-title-fr="..."
  const titleRe = /\{\{i18n-title:([a-zA-Z0-9_.]+)\}\}/g;
  out = out.replace(titleRe, (_, key) => {
    const enVal = en[key];
    const frVal = fr[key];
    if (enVal === undefined && frVal === undefined) return _;
    return `data-title-en="${escapeAttr(enVal ?? '')}" data-title-fr="${escapeAttr(frVal ?? '')}"`;
  });

  // Replace {{i18n-placeholder:key}} with data-placeholder-en="..." data-placeholder-fr="..."
  const placeholderAttrRe = /\{\{i18n-placeholder:([a-zA-Z0-9_.]+)\}\}/g;
  out = out.replace(placeholderAttrRe, (_, key) => {
    const enVal = en[key];
    const frVal = fr[key];
    if (enVal === undefined && frVal === undefined) return _;
    return `data-placeholder-en="${escapeAttr(enVal ?? '')}" data-placeholder-fr="${escapeAttr(frVal ?? '')}"`;
  });

  // Replace {{i18n-tip:key}} with data-tip-en="..." data-tip-fr="..."
  const tipRe = /\{\{i18n-tip:([a-zA-Z0-9_.]+)\}\}/g;
  out = out.replace(tipRe, (_, key) => {
    const enVal = en[key];
    const frVal = fr[key];
    if (enVal === undefined && frVal === undefined) return _;
    return `data-tip-en="${escapeAttr(enVal ?? '')}" data-tip-fr="${escapeAttr(frVal ?? '')}"`;
  });

  // Replace {{i18n:script-json}} with JSON for page title/description (for setLanguage)
  const scriptJson = {
    title: { en: en['page.title'] ?? '', fr: fr['page.title'] ?? '' },
    description: { en: en['page.description'] ?? '', fr: fr['page.description'] ?? '' }
  };
  const scriptJsonStr = JSON.stringify(scriptJson);
  out = out.replace(/\{\{i18n:script-json\}\}/g, () => scriptJsonStr);

  fs.writeFileSync(indexPath, out, 'utf8');
  console.log('Built i18n: replaced {{i18n:key}} in index.html from locales/en.json and locales/fr.json');
}

build();
