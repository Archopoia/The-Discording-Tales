/**
 * Build partials/pitch-deck.html from assets/PITCH_DECK_DRD.md (FR) and PITCH_DECK_DRD_EN.md (EN).
 * Outputs a bilingual .pitch-deck root with data-fr / data-en for language switching.
 *
 * Pitch markdown is a local working copy (gitignored). When it is absent, keep the
 * committed partials/pitch-deck.html so CI can still publish the site.
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

const GAMEFEEL_FR = {
  title: 'Gamefeel (jeu vidéo seulement)',
  paras: [
    'Vous êtes dans une poche souterraine verticale sous Iaôdunaï, traversée de plateformes de corde, de failles cristallines et de passages contrôlés par différents groupes.',
    'Une porte verrouillée bloque un accès de palier. Une source lumineuse vivante influence la perception des créatures alentours. Une patrouille de Bêstres circule selon des règles simples liées à la lumière et aux espaces ouverts. Un mécanisme ancien Aïar est visible mais partiellement inaccessible.',
    'Les créatures du monde ne se déplacent pas uniquement comme des ennemis statiques, mais comme des entités guidées par des besoins concrets et immédiats. La faim, la menace et l’opportunité structurent leurs comportements de manière visible. Un ogre affamé peut traverser les cavernes à la recherche de nourriture, consommer des champignons ou, si la faim devient critique, vouloir manger des gobelins même vivant. Le monde devient ainsi un espace de prédation opportuniste où les interactions ne sont jamais entièrement scriptées.',
    'Les conséquences de ces comportements sont physiques et persistantes dans l’espace. Par exemple, des créatures peuvent exploiter ce qui reste d’un adversaire de manière utilitaire : un corps peut être traîné dans leur antre pour un repas futur, démembré pour être utilisé telle une arme.',
    'Vous aussi vous interagissez physiquement avec le monde : déplacer une caisse, un débris ou un corps peut bloquer ou détourner un passage, créer un appui improvisé, ou modifier un trajet ennemi. L’environnement est lisible dès le début mais rarement accessible sans compréhension des couches physiques et sociales simples.',
    'Le système répond de manière cohérente : activer ou perturber une source lumineuse modifie les comportements locaux et révèle ou masque certains passages. Des mécanismes physiques simples (pression, obstruction, énergie) peuvent changer les routes disponibles, sans création de nouveaux niveaux, mais par reconfiguration locale de l’espace.',
    'Les outils (crochet de corde, vision bathoscopique, artefact simple) permettent de revisiter des zones connues sous une nouvelle lecture : un passage devient accessible, une paroi révèle une ouverture, une zone interdite peut être contournée par compréhension ou manipulation simple des règles locales.',
    'En combat, tout reste contextuel : pousser une créature, bloquer un passage, utiliser les cordes ou l’environnement pour créer un avantage. Le combat est toujours lié à l’espace physique.',
  ],
};

const GAMEFEEL_EN = {
  title: 'Gamefeel (video game only)',
  paras: [
    'You are in a vertical underground pocket beneath Iaôdunaï, crossed by rope platforms, crystalline faults and passages controlled by different groups.',
    'A locked door blocks access to a landing. A living light source influences the perception of nearby creatures. A patrol of Bêstres moves according to simple rules tied to light and open spaces. An ancient Aïar mechanism is visible but partly inaccessible.',
    'The creatures of this world do not move only as static enemies, but as entities driven by concrete and immediate needs. Hunger, threat and opportunity visibly structure their behaviour. A hungry ogre may cross the caverns in search of food, eat mushrooms or, if hunger becomes critical, want to eat goblins even alive. The world thus becomes a space of opportunistic predation where interactions are never entirely scripted.',
    'The consequences of these behaviours are physical and persistent in space. For example, creatures may exploit what remains of an adversary in a utilitarian way: a body may be dragged into their lair for a future meal, dismembered to be used as a weapon.',
    'You too physically interact with the world: moving a crate, debris or a body can block or divert a passage, create an improvised support, or alter an enemy route. The environment is legible from the start but rarely accessible without an understanding of the simple physical and social layers.',
    'The system answers coherently: activating or disrupting a light source modifies local behaviours and reveals or conceals certain passages. Simple physical mechanisms (pressure, obstruction, energy) can change the available routes, without creating new levels, but by locally reconfiguring the space.',
    'The tools (rope hook, bathoscopic vision, simple artifact) make it possible to revisit known areas under a new reading: a passage becomes accessible, a wall reveals an opening, a forbidden area can be bypassed by understanding or simple manipulation of the local rules.',
    'In combat, everything stays contextual: pushing a creature, blocking a passage, using the ropes or the environment to create an advantage. Combat is always tied to physical space.',
  ],
};

function gamefeelSectionHtml(md) {
  const feel = /The Discording System/i.test(md) ? GAMEFEEL_EN : GAMEFEEL_FR;
  const paras = feel.paras.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n                ');
  return `<section class="pitch-deck__section">
                <h3 class="pitch-deck__section-title">${escapeHtml(feel.title)}</h3>
                ${paras}
            </section>`;
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
  const systemHeadingRe =
    /^\*\*((?:Le Système Discordant|The Discording System)(?:\s*\([^)]*\))?)\*\*/m;
  const systemTitle = md.match(systemHeadingRe)?.[1] || 'System';

  const themesHtml = themesTableToHtml(md);

  const systemIntro = extractBetween(
    md,
    [/^\*\*(?:Le Système Discordant|The Discording System)(?:\s*\([^)]*\))?\*\*/],
    [/^\*\*Cinq piliers|^\*\*Five mechanical pillars/]
  );
  const philosophyPara = systemIntro
    .replace(/^\*\*(?:Le Système Discordant|The Discording System)(?:\s*\([^)]*\))?\*\*/m, '')
    .trim();
  const philosophyParas = philosophyPara
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${mdBlockToHtml(p)}</p>`)
    .join('\n                ');
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
            ${gamefeelSectionHtml(md)}
            <section class="pitch-deck__section">
                <h3 class="pitch-deck__section-title">${escapeHtml(systemTitle)}</h3>
                ${philosophyParas}
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
    // Pitch drafts are gitignored. CI keeps the committed partial.
    if (fs.existsSync(outPath)) {
      console.log('Pitch source not found, using pre-built', outPath);
      return;
    }
    console.error('Pitch source not found and no pre-built output:', pitchMdFr);
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
