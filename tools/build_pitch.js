/**
 * Build partials/pitch-deck.html from assets/PITCH_DECK_DRD.md (FR) and PITCH_DECK_DRD_EN.md (EN).
 * Outputs a bilingual .pitch-deck root with data-fr / data-en for language switching.
 *
 * Usage: node tools/build_pitch.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pitchMdFr = path.join(root, 'assets', 'PITCH_DECK_DRD.md');
const pitchMdEn = path.join(root, 'assets', 'PITCH_DECK_DRD_EN.md');
const outPath = path.join(root, 'partials', 'pitch-deck.html');

marked.setOptions({ gfm: true, breaks: true });

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stripMdArtifacts(md) {
  return md.replace(/\r\n/g, '\n').replace(/^\*\*\*\*\s*$/gm, '').trim();
}

function mdInlineToHtml(text) {
  return marked.parseInline(text.trim());
}

function mdBlockToHtml(text) {
  return marked.parse(text.trim()).replace(/^<p>|<\/p>$/g, '');
}

function extractBetween(md, startPatterns, endPatterns) {
  const lines = md.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (startPatterns.some((p) => p.test(t))) {
      start = i;
      break;
    }
  }
  if (start < 0) return '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (endPatterns.some((p) => p.test(t))) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trim();
}

function themesTableToHtml(md) {
  const tableMatch = md.match(/\|[^\n]*BRIGHTSTRIFE[\s\S]*?\n\n/);
  if (!tableMatch) return '';
  const rows = [];
  const rowRe = /\|\s*\*\*([^*|]+)\*\*\s*\|\s*([^|]+)\|/g;
  let m;
  while ((m = rowRe.exec(tableMatch[0])) !== null) {
    const key = m[1].trim();
    const val = m[2].trim();
    if (!key || key === 'Thème' || key === 'Theme') continue;
    rows.push(
      `<tr>
                                <th scope="row">${escapeHtml(key)}</th>
                                <td>${mdInlineToHtml(val)}</td>
                            </tr>`
    );
  }
  if (!rows.length) return '';
  return `<div class="pitch-deck__table-wrap">
                    <table class="pitch-deck__table lore-table">
                        <tbody>
                            ${rows.join('\n                            ')}
                        </tbody>
                    </table>
                </div>`;
}

function pillarsFromMd(md) {
  const block = extractBetween(
    md,
    [/^\*\*Cinq piliers|^-\s+\*\*Les 8 Colonnes|^-\s+\*\*The 8 Columns/],
    [/^\*\*Public visé|^\*\*Target audience|^\*Le système|^\*The system/]
  );
  const items = [];
  const itemRe = /^-\s+\*\*([\s\S]+?)\*\*\s*-\s*([\s\S]+)$/gm;
  let m;
  while ((m = itemRe.exec(block)) !== null) {
    items.push(`<li><strong>${mdInlineToHtml(m[1])}</strong> - ${mdInlineToHtml(m[2])}</li>`);
  }
  return items.join('\n                    ');
}

function pitchMdToHtml(md) {
  md = stripMdArtifacts(md);
  const lines = md.split('\n');

  const titleLine = lines.find((l) => /DISCORDING|RÉCITS DISCORDANTS/i.test(l) && /^\*\*/.test(l.trim()));
  const taglineLine = lines.find((l) => /ethno-science-fantasy/i.test(l) && /^\*\*/.test(l.trim()));
  const ledeLine = lines.find((l) => /^\*[^*].*\*$/.test(l.trim()) && /étranger|foreign/i.test(l));

  const title = titleLine ? titleLine.replace(/^\*\*|\*\*$/g, '').trim() : 'PITCH';
  const tagline = taglineLine ? taglineLine.replace(/^\*\*|\*\*$/g, '').trim() : '';
  const lede = ledeLine ? ledeLine.replace(/^\*|\*$/g, '').trim() : '';

  const introBlock = extractBetween(
    md,
    [/^\*\*(Des Récits|The Discording)/],
    [/^\*\*L'Univers\*\*|^\*\*The Setting\*\*/]
  );
  const introParas = introBlock
    .split(/\n(?=\*[^*\n])/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const html = marked.parse(p.trim());
      if (p.startsWith('*') && !p.startsWith('**')) {
        return html.replace('<p><em>', '<p class="pitch-deck__aside"><em>').replace(/^<p>/, '<p class="pitch-deck__aside">');
      }
      return html;
    })
    .join('\n                ');

  const settingBlock = extractBetween(
    md,
    [/^\*\*L'Univers\*\*|^\*\*The Setting\*\*/],
    [/^\*\*Thématiques\*\*|^\*\*Themes\*\*/]
  );
  const settingParas = settingBlock
    .replace(/^\*\*L'Univers\*\*|^\*\*The Setting\*\*/m, '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${mdBlockToHtml(p)}</p>`)
    .join('\n                ');

  const settingTitle = /^\*\*The Setting\*\*/m.test(md) ? 'The Setting' : "L'Univers";
  const themesTitle = /^\*\*Themes\*\*/m.test(md) ? 'Themes' : 'Thématiques';
  const systemTitle =
    md.match(/^\*\*(Le Système Discordant|The Discording System)\*\*/m)?.[1] || 'System';

  const themesHtml = themesTableToHtml(md);

  const systemIntro = extractBetween(
    md,
    [/^\*\*Le Système Discordant\*\*|^\*\*The Discording System\*\*/],
    [/^\*\*Cinq piliers|^\*\*Five mechanical pillars/]
  );
  const philosophyPara = systemIntro
    .replace(/^\*\*Le Système Discordant\*\*|^\*\*The Discording System\*\*/m, '')
    .trim();
  const pillarsLabel = /Five mechanical pillars/i.test(md)
    ? 'Five mechanical pillars:'
    : 'Cinq piliers mécaniques :';
  const pillarsHtml = pillarsFromMd(md);

  const targetMatch = md.match(
    /\*\*(?:Public visé|Target audience)\*\*:\s*([\s\S]*?)(?=\n\n|\*Le système|\*The system)/
  );
  const asideMatch = md.match(/\*(Le système met|The system puts)[\s\S]*?\*/);
  const formatMatch = md.match(
    /\*\*(?:Format envisagé|Planned format)\*\*:\s*([\s\S]*?)$/
  );

  const lang = /The Discording Tales/i.test(title) ? 'en' : 'fr';

  return `<div class="pitch-deck" lang="${lang}">
    <header class="pitch-deck__hero">
        <h2 class="pitch-deck__title"><strong>${escapeHtml(title)}</strong></h2>
        <p class="pitch-deck__tagline"><strong>${mdInlineToHtml(tagline)}</strong></p>
        <p class="pitch-deck__lede"><em>${mdInlineToHtml(lede)}</em></p>
    </header>

    <div class="pitch-deck__pages">
        <article class="pitch-deck__page pitch-deck__page--recto">
            <section class="pitch-deck__section">
                ${introParas}
            </section>

            <section class="pitch-deck__section">
                <h3 class="pitch-deck__section-title">${escapeHtml(settingTitle)}</h3>
                ${settingParas}
            </section>

            <section class="pitch-deck__section">
                <h3 class="pitch-deck__section-title">${escapeHtml(themesTitle)}</h3>
                ${themesHtml}
            </section>
        </article>

        <article class="pitch-deck__page pitch-deck__page--verso">
            <section class="pitch-deck__section">
                <h3 class="pitch-deck__section-title">${escapeHtml(systemTitle)}</h3>
                <p>${mdBlockToHtml(philosophyPara)}</p>
                <p><strong>${escapeHtml(pillarsLabel.replace(':', ''))}</strong></p>
                <ul class="pitch-deck__pillars">
                    ${pillarsHtml}
                </ul>
                ${
                  targetMatch
                    ? `<p><strong>${/Target audience/i.test(targetMatch[0]) ? 'Target audience' : 'Public visé'}:</strong> ${mdInlineToHtml(targetMatch[1].trim())}</p>`
                    : ''
                }
                ${
                  asideMatch
                    ? `<p class="pitch-deck__aside"><em>${mdInlineToHtml(asideMatch[0].replace(/^\*|\*$/g, ''))}</em></p>`
                    : ''
                }
                ${
                  formatMatch
                    ? `<p><strong>${/Planned format/i.test(formatMatch[0]) ? 'Planned format' : 'Format envisagé'}:</strong> ${mdInlineToHtml(formatMatch[1].trim())}</p>`
                    : ''
                }
            </section>
        </article>
    </div>
</div>`;
}

function wrapBilingual(htmlFr, htmlEn) {
  const stripRoot = (html) =>
    html
      .replace(/^<div class="pitch-deck"[^>]*>\n?/, '')
      .replace(/\n?<\/div>\s*$/, '');
  const innerFr = stripRoot(htmlFr);
  const innerEn = stripRoot(htmlEn);
  return `<!-- Pitch Deck DRD (bilingual: assets/PITCH_DECK_DRD.md + PITCH_DECK_DRD_EN.md) -->
<div class="pitch-deck" data-fr="${escapeAttr(innerFr)}" data-en="${escapeAttr(innerEn)}" lang="fr">
${innerFr}
</div>`;
}

function build() {
  if (!fs.existsSync(pitchMdFr)) {
    console.error('Missing', pitchMdFr);
    process.exit(1);
  }
  const mdFr = fs.readFileSync(pitchMdFr, 'utf8');
  let mdEn = mdFr;
  if (fs.existsSync(pitchMdEn)) {
    mdEn = fs.readFileSync(pitchMdEn, 'utf8');
  } else {
    console.warn('EN pitch not found, using FR for data-en:', pitchMdEn);
  }
  const htmlFr = pitchMdToHtml(mdFr);
  const htmlEn = pitchMdToHtml(mdEn);
  const out = wrapBilingual(htmlFr, htmlEn);
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('Built partials/pitch-deck.html from FR + EN pitch sources');
}

build();
