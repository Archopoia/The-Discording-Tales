/**
 * Indexable rules hub + attributes overview from public/data/attributes-tree.json.
 * Deep interactive rules stay on /site/#tabletop - these pages are SEO doors.
 *
 * Run: node tools/build_seo_rules_pages.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE, esc, metaDescription, pageShell, writeManifestFile } from './seo-shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'public', 'data', 'attributes-tree.json');
const rulesDir = path.join(root, 'rules');

function build() {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const attrs = data.attributes || {};
  const attrList = Object.values(attrs).filter((a) => a && a.name && a.name.en);

  fs.mkdirSync(path.join(rulesDir, 'attributes'), { recursive: true });

  const attrItems = attrList
    .map((a) => {
      const name = a.name.en;
      const desc = (a.desc && a.desc.en) || '';
      return `<li><strong>${esc(name)}</strong> (${esc(a.abbr || a.id)})<p>${esc(desc)}</p></li>`;
    })
    .join('\n');

  const paths = ['/rules/', '/rules/attributes/'];

  const hubDesc = metaDescription(
    'Rules overview for The Discording Tales tabletop RPG',
    'attributes, aptitudes, and how the ethno-science-fantasy system locks to the world.',
  );
  fs.writeFileSync(
    path.join(rulesDir, 'index.html'),
    pageShell({
      title: 'Rules overview | THE DISCORDING TALES',
      description: hubDesc,
      canonical: `${BASE}/rules/`,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Rules - The Discording Tales',
        description: hubDesc,
        url: `${BASE}/rules/`,
        isPartOf: { '@type': 'WebSite', name: 'THE DISCORDING TALES', url: `${BASE}/` },
      }),
      bodyHtml: `
    <p class="kicker">Rules</p>
    <h1>Rules overview</h1>
    <p class="lede">The Discording Tales tabletop system is rules heavy and procedures light - built so alien cultures stay playable. Interactive tools live on the full site; these pages are the indexable map.</p>
    <article>
      <h2>How the system hangs together</h2>
      <p>Characters are built from peoples, moralities, attributes, and aptitudes. The world is not a human default: <a href="${esc(BASE)}/world/peoples/">peoples</a> and <a href="${esc(BASE)}/lore/">lore</a> tell you what competence and desire mean before dice do. Eight interaction paths (Battle &amp; Debate, Infiltration &amp; Investigation, Craft &amp; Enigma, Travel &amp; Feast) structure how tables touch the underworld.</p>
      <h2>Browse</h2>
      <ul class="list">
        <li><a href="${esc(BASE)}/rules/attributes/">Attributes</a><p>${attrList.length} core attributes with English descriptions from the live rules data.</p></li>
        <li><a href="${esc(BASE)}/character-sheet/">Character sheet</a><p>Free browser sheet on the full site.</p></li>
        <li><a href="${esc(BASE)}/tabletop/">Tabletop book</a><p>Early-access PDF, 300 pages and more.</p></li>
        <li><a href="${esc(BASE)}/site/#tabletop">Full site - tabletop tools</a><p>Rules accordion, zine, sheet, chatbot.</p></li>
      </ul>
      <h2>Same world, video path</h2>
      <p>The Action RPG is a first-person immersive sim built for people still waiting on another Morrowind - see the <a href="${esc(BASE)}/guide/morrowind-immersive-sim-action-rpg/">play guide</a>. Ethno frame: <a href="${esc(BASE)}/guide/ethno-science-fantasy/">what is ethno-science-fantasy?</a></p>
    </article>`,
      ctaPrimaryHref: `${BASE}/site/#tabletop`,
      ctaPrimaryLabel: 'Open tabletop on the full site',
    }),
    'utf8',
  );

  const attrDesc = metaDescription(
    'Character attributes in The Discording Tales',
    'Strength, Agility, Dexterity, Vigor, and the full attribute set for the ethno-science-fantasy tabletop RPG.',
  );
  fs.writeFileSync(
    path.join(rulesDir, 'attributes', 'index.html'),
    pageShell({
      title: 'Attributes | Rules | THE DISCORDING TALES',
      description: attrDesc,
      canonical: `${BASE}/rules/attributes/`,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Attributes - The Discording Tales',
        description: attrDesc,
        url: `${BASE}/rules/attributes/`,
        author: { '@type': 'Organization', name: 'The Discording Tales' },
        isPartOf: { '@type': 'WebSite', name: 'THE DISCORDING TALES', url: `${BASE}/` },
      }),
      bodyHtml: `
    <p class="kicker"><a href="${esc(BASE)}/rules/">Rules</a></p>
    <h1>Attributes</h1>
    <p class="lede">Core attributes from the live rules data. Use them with a people from the <a href="${esc(BASE)}/world/peoples/">peoples index</a> and the <a href="${esc(BASE)}/character-sheet/">character sheet</a>.</p>
    <article>
      <ul class="list">
${attrItems}
      </ul>
      <h2>Next</h2>
      <ul>
        <li><a href="${esc(BASE)}/rules/">Rules overview</a></li>
        <li><a href="${esc(BASE)}/site/#tabletop">Interactive rules on the full site</a></li>
        <li><a href="${esc(BASE)}/tabletop/">Tabletop book landing</a></li>
      </ul>
    </article>`,
      ctaPrimaryHref: `${BASE}/site/#sheet`,
      ctaPrimaryLabel: 'Open the character sheet',
    }),
    'utf8',
  );

  writeManifestFile(rulesDir, paths);
  console.log(`Built rules SEO: hub + attributes (${attrList.length})`);
}

build();
