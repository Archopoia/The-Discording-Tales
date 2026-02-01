/**
 * One-off full i18n migration: extract all data-en/data-fr (and aria, alt, title, placeholder, tip)
 * from index.template.html and partials, assign keys, merge into locales, replace with placeholders.
 * Run once: node tools/migrate_i18n_full.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const templatePath = path.join(root, 'index.template.html');
const peoplesPath = path.join(root, 'partials', 'peoples-cards.html');
const inspirationsPath = path.join(root, 'partials', 'inspirations-keywords.html');
const localesDir = path.join(root, 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

function unescapeAttr(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// (type, en, fr) -> key; and key -> { en, fr } for JSON
const pairToKey = new Map();
const keyToPair = new Map();
const sectionIndex = { tpl: 0, peoples: 0, inspirations: 0 };

function getOrAssignKey(type, en, fr, section) {
  const dedupe = `${type}\n${en}\n${fr}`;
  if (pairToKey.has(dedupe)) return pairToKey.get(dedupe);
  const idx = ++sectionIndex[section];
  const key = `${section}.${idx}`;
  pairToKey.set(dedupe, key);
  keyToPair.set(key, { en: unescapeAttr(en), fr: unescapeAttr(fr) });
  return key;
}

const TYPES = [
  {
    name: 'text',
    re: /data-en="((?:[^"]|&quot;)*)"[^<]*data-fr="((?:[^"]|&quot;)*)"|data-fr="((?:[^"]|&quot;)*)"[^<]*data-en="((?:[^"]|&quot;)*)"/g,
    placeholder: (k) => `{{i18n:${k}}}`,
  },
  {
    name: 'aria',
    re: /data-aria-label-en="((?:[^"]|&quot;)*)"[^<]*data-aria-label-fr="((?:[^"]|&quot;)*)"|data-aria-label-fr="((?:[^"]|&quot;)*)"[^<]*data-aria-label-en="((?:[^"]|&quot;)*)"/g,
    placeholder: (k) => `{{i18n-aria:${k}}}`,
  },
  {
    name: 'alt',
    re: /data-alt-en="((?:[^"]|&quot;)*)"[^<]*data-alt-fr="((?:[^"]|&quot;)*)"|data-alt-fr="((?:[^"]|&quot;)*)"[^<]*data-alt-en="((?:[^"]|&quot;)*)"/g,
    placeholder: (k) => `{{i18n-alt:${k}}}`,
  },
  {
    name: 'title',
    re: /data-title-en="((?:[^"]|&quot;)*)"[^<]*data-title-fr="((?:[^"]|&quot;)*)"|data-title-fr="((?:[^"]|&quot;)*)"[^<]*data-title-en="((?:[^"]|&quot;)*)"/g,
    placeholder: (k) => `{{i18n-title:${k}}}`,
  },
  {
    name: 'placeholder',
    re: /data-placeholder-en="((?:[^"]|&quot;)*)"[^<]*data-placeholder-fr="((?:[^"]|&quot;)*)"|data-placeholder-fr="((?:[^"]|&quot;)*)"[^<]*data-placeholder-en="((?:[^"]|&quot;)*)"/g,
    placeholder: (k) => `{{i18n-placeholder:${k}}}`,
  },
  {
    name: 'tip',
    re: /data-tip-en="((?:[^"]|&quot;)*)"[^<]*data-tip-fr="((?:[^"]|&quot;)*)"|data-tip-fr="((?:[^"]|&quot;)*)"[^<]*data-tip-en="((?:[^"]|&quot;)*)"/g,
    placeholder: (k) => `{{i18n-tip:${k}}}`,
  },
];

function processFile(content, section) {
  let out = content;
  for (const { re, placeholder } of TYPES) {
    re.lastIndex = 0;
    out = out.replace(re, (match, g1, g2, g3, g4) => {
      const en = g1 !== undefined ? g1 : g4;
      const fr = g2 !== undefined ? g2 : g3;
      const key = getOrAssignKey('text', en, fr, section);
      return placeholder(key);
    });
  }
  return out;
}

// Skip already-migrated placeholders (don't treat as literal)
function processFileSkipPlaceholders(content, section) {
  let out = content;
  for (const { re, placeholder } of TYPES) {
    const re2 = new RegExp(re.source, 'g');
    out = out.replace(re2, (match, g1, g2, g3, g4) => {
      const en = g1 !== undefined ? g1 : g4;
      const fr = g2 !== undefined ? g2 : g3;
      const key = getOrAssignKey(re === TYPES[0].re ? 'text' : re === TYPES[1].re ? 'aria' : re === TYPES[2].re ? 'alt' : re === TYPES[3].re ? 'title' : re === TYPES[4].re ? 'placeholder' : 'tip', en, fr, section);
      return placeholder(key);
    });
  }
  return out;
}

// Fix: getOrAssignKey needs type from the TYPES iteration
function processFileCorrect(content, section) {
  let out = content;
  for (let i = 0; i < TYPES.length; i++) {
    const { re, placeholder } = TYPES[i];
    const typeName = TYPES[i].name;
    const re2 = new RegExp(re.source, 'g');
    out = out.replace(re2, (match, g1, g2, g3, g4) => {
      const en = g1 !== undefined ? g1 : g4;
      const fr = g2 !== undefined ? g2 : g3;
      const key = getOrAssignKey(typeName, en, fr, section);
      return placeholder(key);
    });
  }
  return out;
}

function main() {
  const existingEn = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const existingFr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const peoplesContent = fs.readFileSync(peoplesPath, 'utf8');
  const inspirationsContent = fs.readFileSync(inspirationsPath, 'utf8');

  const templateOut = processFileCorrect(templateContent, 'tpl');
  const peoplesOut = processFileCorrect(peoplesContent, 'peoples');
  const inspirationsOut = processFileCorrect(inspirationsContent, 'inspirations');

  const newEn = { ...existingEn };
  const newFr = { ...existingFr };
  for (const [key, { en, fr }] of keyToPair) {
    if (!(key in newEn)) newEn[key] = en;
    if (!(key in newFr)) newFr[key] = fr;
  }

  const sortedEn = {};
  const sortedFr = {};
  for (const k of Object.keys(newEn).sort()) {
    sortedEn[k] = newEn[k];
    sortedFr[k] = newFr[k];
  }

  fs.writeFileSync(templatePath, templateOut, 'utf8');
  fs.writeFileSync(peoplesPath, peoplesOut, 'utf8');
  fs.writeFileSync(inspirationsPath, inspirationsOut, 'utf8');
  fs.writeFileSync(enPath, JSON.stringify(sortedEn, null, 2) + '\n', 'utf8');
  fs.writeFileSync(frPath, JSON.stringify(sortedFr, null, 2) + '\n', 'utf8');

  console.log(`Migrated i18n: added ${keyToPair.size} keys, updated template and partials.`);
}

main();
