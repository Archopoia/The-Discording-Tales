/**
 * Build zine HTML from ZINE_Regles_De_Base_10_Pages.md.
 * Writes partials/zine-content.html for injection into index.template.html.
 *
 * - Extracts descriptive nav labels from h1/h2
 * - Wraps h2 sections in cards
 * - Detects formula/example blocks for callouts
 * - Transforms Peuples table to card grid
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

/** Extract short label from "PAGE N : Title" or use fallback */
function extractLabel(block, index, totalBlocks) {
  if (index === 0) return 'Intro';
  if (index === totalBlocks - 1) return 'Fin';
  const h1Match = block.match(/^#\s+(.+)$/m);
  if (h1Match) {
    const full = h1Match[1].trim();
    const pageMatch = full.match(/PAGE\s+\d+\s*:\s*(.+)/i);
    return pageMatch ? pageMatch[1].trim() : full;
  }
  const h2Match = block.match(/^##\s+(.+)$/m);
  if (h2Match) return h2Match[1].trim();
  return String(index + 1);
}

/** Wrap content in callout if heading matches */
function getCalloutClass(h2Text) {
  const t = (h2Text || '').toLowerCase();
  if (t.includes('formule')) return 'zine-callout-formula';
  if (t.includes('exemple')) return 'zine-callout-example';
  if (t.includes('critiques')) return 'zine-callout-tip';
  return null;
}

/** Post-process HTML: wrap h2 sections in cards, add callouts, transform Peuples table */
function processPageHtml(html, pageIndex) {
  // Transform Peuples table into card grid (page 2)
  if (pageIndex === 2 && html.includes('Peuples (en un mot)')) {
    const peuplesMatch = html.match(
      /<table>[\s\S]*?<thead>[\s\S]*?<tr>[\s\S]*?<th>Peuple<\/th>[\s\S]*?<th>En bref<\/th>[\s\S]*?<\/tr>[\s\S]*?<\/thead>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>[\s\S]*?<\/table>/
    );
    if (peuplesMatch) {
      const tbody = peuplesMatch[1];
      const rowRegex = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<\/tr>/g;
      const cards = [];
      let m;
      while ((m = rowRegex.exec(tbody)) !== null) {
        cards.push(
          `<div class="zine-peoples-card genre-card"><span class="zine-peoples-name">${escapeHtml(m[1])}</span><span class="zine-peoples-badge">${escapeHtml(m[2])}</span></div>`
        );
      }
      const gridHtml = `<div class="zine-peoples-grid">${cards.join('')}</div>`;
      html = html.replace(peuplesMatch[0], gridHtml);
    }
  }

  // Split by h2 boundaries and wrap each section in a card
  const parts = html.split(/(?=<h2>)/);
  const result = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const h2Match = part.match(/^<h2>([\s\S]*?)<\/h2>/);
    if (h2Match) {
      const h2Content = h2Match[1];
      const h2Text = h2Content.replace(/<[^>]+>/g, '').trim();
      const body = part.slice(h2Match[0].length).trim();
      const calloutClass = getCalloutClass(h2Text);

      let cardHtml = `<div class="zine-section-card genre-card">
  <div class="zine-section-card-header"><h2>${h2Content}</h2></div>
  <div class="zine-section-card-body">${body}</div>
</div>`;

      if (calloutClass) {
        cardHtml = `<div class="zine-callout ${calloutClass}">${cardHtml}</div>`;
      }
      result.push(cardHtml);
    } else {
      // Content before first h2 (e.g. intro block's h1 + p, or page title)
      result.push(part);
    }
  }

  return result.join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Wrap inline code that looks like dice notation with zine-dice-code */
function enhanceDiceCode(html) {
  return html.replace(
    /<code>([^<]*?[+\-0−dD\d][^<]*?)<\/code>/g,
    (_, content) => {
      const trimmed = content.trim();
      if (/^[+\-0−dD\s]+$/.test(trimmed) || /^\d+dD/.test(trimmed) || /d6/.test(trimmed)) {
        return `<code class="zine-dice-code">${content}</code>`;
      }
      return `<code>${content}</code>`;
    }
  );
}

/** Wrap "Sans dés spéciaux ?" paragraph in tip callout (in page 3) */
function wrapD6Tip(html, pageIndex) {
  if (pageIndex !== 3) return html;
  return html.replace(
    /<p><strong>Sans dés spéciaux \?<\/strong>[\s\S]*?<\/p>/,
    (match) => `<div class="zine-callout zine-callout-tip">${match}</div>`
  );
}

function build() {
  const md = fs.readFileSync(zineMdPath, 'utf8');
  const blocks = md.split(/\n---\n/).filter(Boolean);
  const totalBlocks = blocks.length;

  const labels = blocks.map((_, i) => extractLabel(blocks[i], i, totalBlocks));

  const navItems = blocks
    .map((_, i) => {
      const label = labels[i];
      const checked = i === 0 ? ' checked' : '';
      return `<input type="radio" name="zine-page" id="zine-page-radio-${i}" value="${i}" class="zine-page-radio"${checked} aria-controls="zine-page-${i}"/><label for="zine-page-radio-${i}" class="zine-page-nav-label">${escapeHtml(label)}</label>`;
    })
    .join('\n');

  const nav = `<nav class="zine-pages-nav" role="tablist" aria-label="Zine pages">\n${navItems}\n</nav>`;

  const sections = blocks.map((block, i) => {
    const trimmed = block.trim();
    let html = marked.parse(trimmed);
    html = processPageHtml(html, i);
    html = enhanceDiceCode(html);
    html = wrapD6Tip(html, i);
    const activeClass = i === 0 ? ' zine-page-active' : '';
    return `<section id="zine-page-${i}" class="zine-page zine-page-panel${activeClass}" data-page="${i}" role="tabpanel" aria-labelledby="zine-page-radio-${i}">${html}</section>`;
  });

  const wrapped = `<div class="zine-content tdt-scrollable zine-layout">
  <aside class="zine-sidebar">
${nav}
  </aside>
  <div class="zine-pages-container">
${sections.join('\n')}
  </div>
</div>`;

  if (!fs.existsSync(partialsDir)) {
    fs.mkdirSync(partialsDir, { recursive: true });
  }
  fs.writeFileSync(outPath, wrapped, 'utf8');
  console.log('Built partials/zine-content.html from ZINE_Regles_De_Base_10_Pages.md');
}

build();
