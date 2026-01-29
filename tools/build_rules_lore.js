/**
 * Build a single rules/lore text file from reference/TTRPG_DRD/System_Summary
 * for the WebLLM GM prompt (no RAG in browser). Output: public/drd-rules-lore.txt
 *
 * Run from project root: node tools/build_rules_lore.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REF_DIR = path.join(PROJECT_ROOT, 'reference', 'TTRPG_DRD', 'System_Summary');
const OUT_FILE = path.join(PROJECT_ROOT, 'public', 'drd-rules-lore.txt');

// Order: core rules first, then creation, peoples, world, lore, rest
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

function main() {
  if (!fs.existsSync(REF_DIR)) {
    console.error('Reference dir not found:', REF_DIR);
    process.exit(1);
  }

  const parts = [];
  for (const name of FILE_ORDER) {
    const fp = path.join(REF_DIR, name);
    if (!fs.existsSync(fp)) continue;
    try {
      const text = fs.readFileSync(fp, 'utf8').trim();
      if (text) {
        parts.push(`\n\n---\n\n# File: ${name}\n\n${text}`);
      }
    } catch (e) {
      console.warn('Skip', name, e.message);
    }
  }

  // Also include any remaining .md files not in FILE_ORDER
  const included = new Set(FILE_ORDER);
  try {
    const files = fs.readdirSync(REF_DIR);
    for (const name of files.sort()) {
      if (!name.endsWith('.md') || included.has(name)) continue;
      if (name.startsWith('_') || name === '00_INDEX.md') continue;
      const fp = path.join(REF_DIR, name);
      try {
        const text = fs.readFileSync(fp, 'utf8').trim();
        if (text) {
          parts.push(`\n\n---\n\n# File: ${name}\n\n${text}`);
        }
      } catch (e) {
        console.warn('Skip', name, e.message);
      }
    }
  } catch (e) {
    console.warn('Listing dir:', e.message);
  }

  const outDir = path.dirname(OUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let content = parts.join('').replace(/^\n+/, '');
  // Keep under ~120k chars (~30k tokens) so WebLLM context isn't exceeded
  const MAX_CHARS = 120000;
  if (content.length > MAX_CHARS) {
    content = content.slice(0, MAX_CHARS) + '\n\n[... rules truncated for context limit ...]';
    console.warn('Truncated to', MAX_CHARS, 'chars');
  }
  fs.writeFileSync(OUT_FILE, content, 'utf8');
  console.log('Wrote', OUT_FILE, '(' + (content.length / 1024).toFixed(1) + ' KB)');
}

main();
