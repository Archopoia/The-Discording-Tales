/**
 * Build zine HTML from ZINE_Regles_De_Base_10_Pages.md (FR) and ZINE_Regles_De_Base_10_Pages_EN.md (EN).
 * Intro tab (page 0) is replaced by assets/PITCH_DECK_DRD_7P.md (French pitch deck).
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
const pitchDeck7pPath = path.join(root, 'assets', 'PITCH_DECK_DRD_7P.md');
const partialsDir = path.join(root, 'partials');
const outPath = path.join(partialsDir, 'zine-content.html');

marked.setOptions({ gfm: true, breaks: true });

const ZINE_INTRO_LABEL_FR = "Dix pages d'Introduction";
const ZINE_INTRO_LABEL_EN = 'Ten Introduction Pages';

/** Extract short label from "PAGE N : Title" or use fallback */
function extractLabel(block, index, totalBlocks, lang = 'fr') {
  if (index === 0) return lang === 'en' ? ZINE_INTRO_LABEL_EN : ZINE_INTRO_LABEL_FR;
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

function htmlFromMdBlock(block, pageIndex) {
  let html = marked.parse(block.trim());
  html = processPageHtml(html, pageIndex);
  html = enhanceDiceCode(html);
  html = wrapD6Tip(html, pageIndex);
  return html;
}

function buildIntroSection(introHtml) {
  const escaped = escapeAttr(introHtml);
  return `<section id="zine-page-0" class="zine-page zine-page-panel zine-page-active" data-page="0" role="tabpanel" aria-labelledby="zine-page-radio-0" data-fr="${escaped}" data-en="${escaped}">${introHtml}</section>`;
}

/** When full zine markdown is unavailable, patch Intro from PITCH_DECK_DRD_7P.md only. */
function patchZineIntroOnly() {
  if (!fs.existsSync(pitchDeck7pPath) || !fs.existsSync(outPath)) {
    return false;
  }
  const pitchMd = fs.readFileSync(pitchDeck7pPath, 'utf8').replace(/\r\n/g, '\n');
  const introHtml = htmlFromMdBlock(pitchMd, 0);
  let zine = fs.readFileSync(outPath, 'utf8');
  const start = zine.indexOf('<section id="zine-page-0"');
  const end = zine.indexOf('<section id="zine-page-1"');
  if (start < 0 || end < 0) {
    return false;
  }
  zine = zine.slice(0, start) + buildIntroSection(introHtml) + '\n' + zine.slice(end);
  fs.writeFileSync(outPath, zine, 'utf8');
  console.log('Patched zine Intro from', pitchDeck7pPath);
  patchZineIntroLabel();
  return true;
}

/** Keep first zine nav label in sync when only patching Intro content. */
function patchZineIntroLabel() {
  if (!fs.existsSync(outPath)) {
    return false;
  }
  let zine = fs.readFileSync(outPath, 'utf8');
  const before = zine;
  zine = zine.replace(
    /(<label for="zine-page-radio-0" class="zine-page-nav-label" )data-fr="[^"]*" data-en="[^"]*">[^<]*<\/label>/,
    `$1data-fr="${escapeAttr(ZINE_INTRO_LABEL_FR)}" data-en="${escapeAttr(ZINE_INTRO_LABEL_EN)}">${escapeHtml(ZINE_INTRO_LABEL_FR)}</label>`
  );
  if (zine === before) {
    return false;
  }
  fs.writeFileSync(outPath, zine, 'utf8');
  return true;
}

/** Remove the trailing "Fin" / "End" zine page (version stamp only). */
function removeZineFinPage() {
  if (!fs.existsSync(outPath)) {
    return false;
  }
  let zine = fs.readFileSync(outPath, 'utf8');
  const before = zine;
  zine = zine.replace(
    /<input type="radio" name="zine-page" id="zine-page-radio-11"[\s\S]*?<\/label>\n?/,
    ''
  );
  zine = zine.replace(/<section id="zine-page-11"[\s\S]*?<\/section>\n?/, '');
  if (zine === before) {
    return false;
  }
  fs.writeFileSync(outPath, zine, 'utf8');
  console.log('Removed zine Fin page');
  return true;
}

function build() {
  if (!fs.existsSync(zineMdPathFr)) {
    if (patchZineIntroOnly()) {
      removeZineFinPage();
      return;
    }
    if (removeZineFinPage()) {
      return;
    }
    if (fs.existsSync(outPath)) {
      console.log('Zine source not found, using pre-built', outPath);
      return;
    }
    console.error('Zine source not found and no pre-built output:', zineMdPathFr);
    process.exit(1);
  }
  const mdFr = fs.readFileSync(zineMdPathFr, 'utf8').replace(/\r\n/g, '\n');
  const blocksFr = mdFr.split(/\n---\n/).filter(Boolean);
  const sourceBlockCount = blocksFr.length;

  let blocksEn = blocksFr;
  if (fs.existsSync(zineMdPathEn)) {
    const mdEn = fs.readFileSync(zineMdPathEn, 'utf8').replace(/\r\n/g, '\n');
    blocksEn = mdEn.split(/\n---\n/).filter(Boolean);
  }
  if (blocksEn.length !== sourceBlockCount) {
    console.warn('EN zine block count differs from FR; using FR labels/content where missing.');
  }

  if (fs.existsSync(pitchDeck7pPath)) {
    const pitchIntro = fs.readFileSync(pitchDeck7pPath, 'utf8').replace(/\r\n/g, '\n').trim();
    blocksFr[0] = pitchIntro;
    blocksEn[0] = pitchIntro;
  } else {
    console.warn('Pitch deck intro not found:', pitchDeck7pPath);
  }

  // Drop trailing version-stamp page ("Fin" / "End").
  blocksFr.pop();
  if (blocksEn.length > blocksFr.length) {
    blocksEn.pop();
  }

  const totalBlocks = blocksFr.length;

  const labelsFr = blocksFr.map((_, i) => extractLabel(blocksFr[i], i, totalBlocks, 'fr'));
  const labelsEn = blocksEn.map((_, i) => extractLabel(blocksEn[i], i, totalBlocks, 'en'));

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
    const htmlFr = htmlFromMdBlock(block, i);

    let htmlEn = htmlFr;
    if (blocksEn[i] && blocksEn[i] !== block) {
      htmlEn = htmlFromMdBlock(blocksEn[i], i);
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
