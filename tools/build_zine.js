/**
 * Build zine HTML from ZINE_Regles_De_Base_10_Pages.md (FR) and ZINE_Regles_De_Base_10_Pages_EN.md (EN).
 * Writes partials/zine-content.html for injection into index.template.html.
 *
 * - Extracts descriptive nav labels from h1/h2
 * - Wraps h2 sections in cards
 * - Detects formula/example blocks for callouts
 * - Transforms Peuples table to card grid
 * - Outputs data-fr/data-en on nav labels and section content for i18n
 *
 * Usage: node tools/build_zine.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const zineMdPathFr = path.join(root, 'reference', 'TTRPG_DRD', 'System_Summary', 'ZINE_Regles_De_Base_10_Pages.md');
const zineMdPathEn = path.join(root, 'reference', 'TTRPG_DRD', 'System_Summary', 'ZINE_Regles_De_Base_10_Pages_EN.md');
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

/** Wrap content in callout if heading matches (FR or EN) */
function getCalloutClass(h2Text) {
  const t = (h2Text || '').toLowerCase();
  if (t.includes('formule') || t.includes('formula')) return 'zine-callout-formula';
  if (t.includes('exemple') || t.includes('example')) return 'zine-callout-example';
  if (t.includes('critiques') || t.includes('critical')) return 'zine-callout-tip';
  return null;
}

/** Post-process HTML: wrap h2 sections in cards, add callouts, transform Peuples table */
function processPageHtml(html, pageIndex) {
  // Transform Peuples/Peoples table into card grid (page 2)
  if (pageIndex === 2 && (html.includes('Peuples (en un mot)') || html.includes('Peoples (in a word)'))) {
    const peuplesMatch = html.match(
      /<table>[\s\S]*?<thead>[\s\S]*?<tr>[\s\S]*?<th>(?:Peuple|People)<\/th>[\s\S]*?<th>(?:En bref|In brief)<\/th>[\s\S]*?<\/tr>[\s\S]*?<\/thead>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>[\s\S]*?<\/table>/
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

/** Wrap "Sans dés spéciaux ?" / "No special dice?" paragraph in tip callout (in page 3) */
function wrapD6Tip(html, pageIndex) {
  if (pageIndex !== 3) return html;
  return html
    .replace(
      /<p><strong>Sans dés spéciaux \?<\/strong>[\s\S]*?<\/p>/,
      (match) => `<div class="zine-callout zine-callout-tip">${match}</div>`
    )
    .replace(
      /<p><strong>No special dice\?<\/strong>[\s\S]*?<\/p>/,
      (match) => `<div class="zine-callout zine-callout-tip">${match}</div>`
    );
}

/** Escape string for use in HTML attribute (so data-fr/data-en can hold HTML) */
function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function build() {
  const mdFr = fs.readFileSync(zineMdPathFr, 'utf8').replace(/\r\n/g, '\n');
  const blocksFr = mdFr.split(/\n---\n/).filter(Boolean);
  const totalBlocks = blocksFr.length;

  let blocksEn = blocksFr;
  if (fs.existsSync(zineMdPathEn)) {
    const mdEn = fs.readFileSync(zineMdPathEn, 'utf8').replace(/\r\n/g, '\n');
    blocksEn = mdEn.split(/\n---\n/).filter(Boolean);
  }
  if (blocksEn.length !== totalBlocks) {
    console.warn('EN zine block count differs from FR; using FR labels/content where missing.');
  }

  const labelsFr = blocksFr.map((_, i) => extractLabel(blocksFr[i], i, totalBlocks));
  const labelsEn = blocksEn.map((_, i) => {
    if (i === totalBlocks - 1) return 'End';
    return extractLabel(blocksEn[i], i, totalBlocks);
  });

  const navItems = blocksFr
    .map((_, i) => {
      const labelFr = labelsFr[i];
      const labelEn = labelsEn[i] ?? labelFr;
      const checked = i === 0 ? ' checked' : '';
      return `<input type="radio" name="zine-page" id="zine-page-radio-${i}" value="${i}" class="zine-page-radio"${checked} aria-controls="zine-page-${i}"/><label for="zine-page-radio-${i}" class="zine-page-nav-label" data-fr="${escapeAttr(labelFr)}" data-en="${escapeAttr(labelEn)}">${escapeHtml(labelFr)}</label>`;
    })
    .join('\n');

  const nav = `<nav class="zine-pages-nav" role="tablist" aria-label="Zine pages">\n${navItems}\n</nav>`;

  const sections = blocksFr.map((block, i) => {
    const trimmedFr = block.trim();
    let htmlFr = marked.parse(trimmedFr);
    htmlFr = processPageHtml(htmlFr, i);
    htmlFr = enhanceDiceCode(htmlFr);
    htmlFr = wrapD6Tip(htmlFr, i);

    let htmlEn = htmlFr;
    if (blocksEn[i]) {
      const trimmedEn = blocksEn[i].trim();
      htmlEn = marked.parse(trimmedEn);
      htmlEn = processPageHtml(htmlEn, i);
      htmlEn = enhanceDiceCode(htmlEn);
      htmlEn = wrapD6Tip(htmlEn, i);
    }

    const activeClass = i === 0 ? ' zine-page-active' : '';
    return `<section id="zine-page-${i}" class="zine-page zine-page-panel${activeClass}" data-page="${i}" role="tabpanel" aria-labelledby="zine-page-radio-${i}" data-fr="${escapeAttr(htmlFr)}" data-en="${escapeAttr(htmlEn)}">${htmlFr}</section>`;
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
  console.log('Built partials/zine-content.html from FR + EN zine sources');
}

build();
