/**
 * Build a single rules/lore text file from reference/TTRPG_DRD:
 * - System_Summary (MD)
 * - AllBookTables-csv (CSV → markdown tables)
 * - AllBookPages-FullBook (selected pages)
 * For the WebLLM GM prompt (no RAG in browser). Output: public/drd-rules-lore.txt
 *
 * Run from project root: node tools/build_rules_lore.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TTRPG = path.join(PROJECT_ROOT, 'reference', 'TTRPG_DRD');
const REF_SS = path.join(TTRPG, 'System_Summary');
const REF_CSV = path.join(TTRPG, 'AllBookTables-csv');
const REF_BOOK = path.join(TTRPG, 'AllBookPages-FullBook');
const OUT_FILE = path.join(PROJECT_ROOT, 'public', 'drd-rules-lore.txt');

const MAX_TOTAL_CHARS = 120000;
const MAX_SYSTEM_SUMMARY_CHARS = 72000;
const MAX_TABLES_CHARS = 26000;
const MAX_BOOK_PAGES_CHARS = 22000;

// System_Summary: order of files (core rules first)
const FILE_ORDER = [
  '01_Systeme_General.md',
  '03_Attributs_Aptitudes_Competences.md',
  '05_Souffrances_Guérison.md',
  '06_Combat.md',
  '08_Temps_Labeurs.md',
  '09_Groupe_Ambiance.md',
  '10_Voyages.md',
  '16_GM_Quand_Lancer_Jets.md',
  '02_Creation_Personnage.md',
  '12_Peuples_Races.md',
  '14_Monde_Iaodunei.md',
  'LORE_01_Cosmogonie_Divinites.md',
  'LORE_02_Origines_Peuples.md',
  'LORE_03_Peuples_Detail.md',
  '04_Experience_Progression.md',
  '07_Rilie_Magie.md',
  '13_Valeurs_Traits.md',
  '11_Possessions_Equipement.md',
  '15_Strategie_Partage.md',
  'GUIDE_MJ_Peuples.md',
  'LIVRET_Introduction_10_Pages.md',
  'PRESENTATION_Quick_Start.md',
];

// AllBookPages: include first N pages (intro + core rules)
const BOOK_PAGE_FIRST = 1;
const BOOK_PAGE_LAST = 45;

function parseCSVLine(line) {
  const result = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++;
      let cell = '';
      while (i < line.length) {
        if (line[i] === '"') {
          i++;
          if (line[i] === '"') {
            cell += '"';
            i++;
          } else break;
        } else {
          cell += line[i];
          i++;
        }
      }
      result.push(cell.trim());
      if (line[i] === ',') i++;
    } else {
      let end = line.indexOf(',', i);
      if (end === -1) end = line.length;
      result.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  return result;
}

function csvToMarkdown(filePath, maxChars = 8000) {
  let raw;
  for (const enc of ['utf-8', 'utf-8-sig']) {
    try {
      raw = fs.readFileSync(filePath, enc);
      break;
    } catch {
      continue;
    }
  }
  if (!raw) return '';
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return '';
  const rows = lines.map((l) => parseCSVLine(l));
  const ncols = Math.max(...rows.map((r) => r.length));
  for (const r of rows) {
    while (r.length < ncols) r.push('');
  }
  const escape = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    out.push('| ' + rows[i].map(escape).join(' | ') + ' |');
    if (i === 0) out.push('| ' + rows[0].map(() => '---').join(' | ') + ' |');
  }
  let text = out.join('\n');
  if (text.length > maxChars) text = text.slice(0, maxChars - 50) + '\n[... truncated ...]';
  return text;
}

function loadSystemSummary() {
  if (!fs.existsSync(REF_SS)) return '';
  const parts = [];
  let total = 0;
  for (const name of FILE_ORDER) {
    if (total >= MAX_SYSTEM_SUMMARY_CHARS) break;
    const fp = path.join(REF_SS, name);
    if (!fs.existsSync(fp)) continue;
    try {
      const text = fs.readFileSync(fp, 'utf8').trim();
      if (text) {
        const chunk = `\n\n---\n\n# File: ${name}\n\n${text}`;
        if (total + chunk.length > MAX_SYSTEM_SUMMARY_CHARS) {
          parts.push(chunk.slice(0, MAX_SYSTEM_SUMMARY_CHARS - total - 30) + '\n[... truncated ...]');
          total = MAX_SYSTEM_SUMMARY_CHARS;
          break;
        }
        parts.push(chunk);
        total += chunk.length;
      }
    } catch (e) {
      console.warn('Skip', name, e.message);
    }
  }
  const included = new Set(FILE_ORDER);
  try {
    const files = fs.readdirSync(REF_SS);
    for (const name of files.sort()) {
      if (total >= MAX_SYSTEM_SUMMARY_CHARS) break;
      if (!name.endsWith('.md') || included.has(name) || name.startsWith('_') || name === '00_INDEX.md') continue;
      const fp = path.join(REF_SS, name);
      try {
        const text = fs.readFileSync(fp, 'utf8').trim();
        if (text) {
          const chunk = `\n\n---\n\n# File: ${name}\n\n${text}`;
          if (total + chunk.length > MAX_SYSTEM_SUMMARY_CHARS) {
            parts.push(chunk.slice(0, MAX_SYSTEM_SUMMARY_CHARS - total - 30) + '\n[... truncated ...]');
            total = MAX_SYSTEM_SUMMARY_CHARS;
            break;
          }
          parts.push(chunk);
          total += chunk.length;
        }
      } catch (e) {
        console.warn('Skip', name, e.message);
      }
    }
  } catch (e) {
    console.warn('Listing System_Summary:', e.message);
  }
  return parts.join('').replace(/^\n+/, '');
}

function loadTables() {
  if (!fs.existsSync(REF_CSV)) return '';
  const parts = [];
  let total = 0;
  const maxPerTable = 6000;
  let files;
  try {
    files = fs.readdirSync(REF_CSV).filter((n) => n.endsWith('.csv')).sort();
  } catch {
    return '';
  }
  for (const name of files) {
    if (total >= MAX_TABLES_CHARS) break;
    const fp = path.join(REF_CSV, name);
    try {
      const table = csvToMarkdown(fp, maxPerTable);
      if (!table) continue;
      const chunk = `\n\n### Table: ${name}\n\n${table}`;
      if (total + chunk.length > MAX_TABLES_CHARS) {
        parts.push(chunk.slice(0, MAX_TABLES_CHARS - total - 30) + '\n[... truncated ...]');
        total = MAX_TABLES_CHARS;
        break;
      }
      parts.push(chunk);
      total += chunk.length;
    } catch (e) {
      console.warn('Skip table', name, e.message);
    }
  }
  if (parts.length === 0) return '';
  return '\n\n---\n\n# Section: AllBookTables-csv\n\n' + parts.join('').replace(/^\n+/, '');
}

function loadBookPages() {
  if (!fs.existsSync(REF_BOOK)) return '';
  const parts = [];
  let total = 0;
  for (let p = BOOK_PAGE_FIRST; p <= BOOK_PAGE_LAST; p++) {
    if (total >= MAX_BOOK_PAGES_CHARS) break;
    const name = `page_${String(p).padStart(3, '0')}.md`;
    const fp = path.join(REF_BOOK, name);
    if (!fs.existsSync(fp)) continue;
    try {
      const text = fs.readFileSync(fp, 'utf8').trim();
      if (text) {
        const chunk = `\n\n---\n\n# ${name}\n\n${text}`;
        if (total + chunk.length > MAX_BOOK_PAGES_CHARS) {
          parts.push(chunk.slice(0, MAX_BOOK_PAGES_CHARS - total - 30) + '\n[... truncated ...]');
          total = MAX_BOOK_PAGES_CHARS;
          break;
        }
        parts.push(chunk);
        total += chunk.length;
      }
    } catch (e) {
      console.warn('Skip', name, e.message);
    }
  }
  if (parts.length === 0) return '';
  return '\n\n---\n\n# Section: AllBookPages (excerpts)\n\n' + parts.join('').replace(/^\n+/, '');
}

function main() {
  if (!fs.existsSync(REF_SS)) {
    console.error('Reference dir not found:', REF_SS);
    process.exit(1);
  }

  const systemPart = loadSystemSummary();
  const tablesPart = loadTables();
  const bookPart = loadBookPages();

  let content = systemPart;
  if (tablesPart) content += tablesPart;
  if (bookPart) content += bookPart;

  content = content.replace(/^\n+/, '');

  if (content.length > MAX_TOTAL_CHARS) {
    content = content.slice(0, MAX_TOTAL_CHARS) + '\n\n[... rules truncated for context limit ...]';
    console.warn('Truncated total to', MAX_TOTAL_CHARS, 'chars');
  }

  const outDir = path.dirname(OUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUT_FILE, content, 'utf8');
  console.log('Wrote', OUT_FILE, '(' + (content.length / 1024).toFixed(1) + ' KB)');
  console.log('  System_Summary:', (systemPart.length / 1024).toFixed(1), 'KB');
  if (tablesPart) console.log('  AllBookTables-csv:', (tablesPart.length / 1024).toFixed(1), 'KB');
  if (bookPart) console.log('  AllBookPages (excerpts):', (bookPart.length / 1024).toFixed(1), 'KB');
}

main();
