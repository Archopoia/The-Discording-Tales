/**
 * Static SEO guides: ethno pillar, Morrowind/imsim guide, character-sheet,
 * weird-fantasy TTRPG compare, Morrowind-like ARPG compare, tabletop book landing.
 *
 * Run: node tools/build_seo_static_guides.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE, esc, metaDescription, pageShell, writeManifestFile } from './seo-shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function build() {
  // --- Guide pillar: ethno ---
  const guidePaths = [
    '/guide/',
    '/guide/ethno-science-fantasy/',
    '/guide/morrowind-immersive-sim-action-rpg/',
  ];
  fs.mkdirSync(path.join(root, 'guide', 'ethno-science-fantasy'), { recursive: true });
  fs.mkdirSync(path.join(root, 'guide', 'morrowind-immersive-sim-action-rpg'), { recursive: true });

  const guideCanonical = `${BASE}/guide/ethno-science-fantasy/`;
  const guideDesc = metaDescription(
    'Ethno-science-fantasy is the genre frame of The Discording Tales',
    'alien cultures, no humans, and a first-person immersive sim Action RPG for people still waiting on another Morrowind.',
  );
  fs.writeFileSync(
    path.join(root, 'guide', 'ethno-science-fantasy', 'index.html'),
    pageShell({
      title: 'What is ethno-science-fantasy? | THE DISCORDING TALES',
      description: guideDesc,
      canonical: guideCanonical,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'What is ethno-science-fantasy?',
        description: guideDesc,
        url: guideCanonical,
        author: { '@type': 'Organization', name: 'The Discording Tales' },
        isPartOf: { '@type': 'WebSite', name: 'THE DISCORDING TALES', url: `${BASE}/` },
      }),
      bodyHtml: `
    <p class="kicker">Guide</p>
    <h1>What is ethno-science-fantasy?</h1>
    <p class="lede">A short definition for players, GMs, and searchers who want something stranger than recycled high fantasy - and more coherent than a mood board.</p>
    <article>
      <h2>Definition</h2>
      <p><strong>Ethno-science-fantasy</strong> is fantasy built around cultures first: peoples with their own moralities, bodies, and technologies of the strange, set in a cosmos that behaves like myth and physics at once. In <a href="${esc(BASE)}/">The Discording Tales</a> / Des Récits Discordants, there are no humans. You play inside alien needs, desires, and wills that only make sense when the rules and the lore lock together.</p>
      <h2>How it differs from high fantasy</h2>
      <p>High fantasy often centers a human (or human-adjacent) moral default and a familiar medieval toolkit. Ethno-science-fantasy starts from other peoples - <a href="${esc(BASE)}/world/peoples/">Yums, Yors, Beingsts and their nations</a> - and asks what growth, wisdom, joy, or competence mean when the body and the Ril are not yours.</p>
      <h2>How it differs from soft science fantasy</h2>
      <p>Science fantasy can mean lasers on dragons. Here the "science" is diegetic: crystal forests where matter inverts, abundances and festivals named as forces, artefacts and orders that structure play. The wonder is ethnographic and systemic, not only spectacle.</p>
      <h2>What you can explore next</h2>
      <ul>
        <li><a href="${esc(BASE)}/guide/morrowind-immersive-sim-action-rpg/">Morrowind / immersive sim Action RPG</a> - how the video game play shelf fits this world</li>
        <li><a href="${esc(BASE)}/world/origins/">Three origins</a> - how peoples returned from the crust</li>
        <li><a href="${esc(BASE)}/world/peoples/">Peoples index</a> - moralities, lineages, relations</li>
        <li><a href="${esc(BASE)}/lore/">Universe lore</a> - Rildées, festivals, artefacts</li>
        <li><a href="${esc(BASE)}/rules/">Rules overview</a> - attributes and system shape</li>
        <li><a href="${esc(BASE)}/compare/weird-fantasy-ttrpg/">Weird fantasy TTRPGs</a> - tabletop shelf</li>
        <li><a href="${esc(BASE)}/tabletop/">Tabletop book</a> - early-access PDF</li>
        <li><a href="${esc(BASE)}/character-sheet/">Character sheet</a> - play aids on the site</li>
      </ul>
      <h2>Dual path</h2>
      <p>The same world is a <strong>tabletop book</strong> (early-access PDF, 300 pages and more) and a <strong>first-person immersive sim Action RPG</strong> in development - built for people still waiting on another Morrowind: alien cultures, systemic denseness, no human default. The public site is the bilingual hub for both.</p>
    </article>`,
      ctaPrimaryHref: `${BASE}/world/peoples/`,
      ctaPrimaryLabel: 'Browse peoples',
    }),
    'utf8',
  );

  const mwCanonical = `${BASE}/guide/morrowind-immersive-sim-action-rpg/`;
  const mwDesc = metaDescription(
    'Built for people still waiting on another Morrowind',
    'The Discording Tales is a first-person immersive sim Action RPG in a weird ethno-science-fantasy underworld - no humans.',
  );
  fs.writeFileSync(
    path.join(root, 'guide', 'morrowind-immersive-sim-action-rpg', 'index.html'),
    pageShell({
      title: 'Morrowind appetite, immersive sim Action RPG | THE DISCORDING TALES',
      description: mwDesc,
      canonical: mwCanonical,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Built for people still waiting on another Morrowind',
        description: mwDesc,
        url: mwCanonical,
        author: { '@type': 'Organization', name: 'The Discording Tales' },
        isPartOf: { '@type': 'WebSite', name: 'THE DISCORDING TALES', url: `${BASE}/` },
      }),
      bodyHtml: `
    <p class="kicker">Guide</p>
    <h1>Built for people still waiting on another Morrowind</h1>
    <p class="lede">The Discording Tales is a first-person immersive sim Action RPG (and a tabletop book) set in a weird ethno-science-fantasy underworld - alien cultures, no humans, systems that rewrite the same ground.</p>
    <article>
      <h2>Three layers (not one genre sausage)</h2>
      <ol>
        <li><strong>Appetite</strong> - Morrowind: alien cultures, lore-as-systems, first-person freedom, uncanny world.</li>
        <li><strong>Play shelf</strong> - first-person immersive sim action RPG: denseness, tools, factions, return loops.</li>
        <li><strong>World close</strong> - weird ethno-science-fantasy: no humans, living underworld, peoples as the engine.</li>
      </ol>
      <h2>What we mean by immersive sim here</h2>
      <p>Compact ground of extreme systemic density. Almost everything is visible early; little is usable until you understand physical, environmental, and social systems. You return to the same spaces - each tool or understanding changes access, perception, factions, and dangers.</p>
      <h2>Supporting references (role-labeled, not co-headliners)</h2>
      <ul>
        <li><strong>Arx Fatalis</strong> - underworld immersive sim denseness</li>
        <li><strong>Gothic</strong> - factions and reputation pressure</li>
        <li><strong>Kenshi</strong> - world simulation that keeps answering</li>
      </ul>
      <h2>What this is not</h2>
      <ul>
        <li>A Vvardenfell reskin or "spiritual successor" slogan as the whole pitch</li>
        <li>A finished AAA Action RPG you can buy today - the video path is in development; the <a href="${esc(BASE)}/tabletop/">tabletop book</a> is already in early access (300+ pages)</li>
        <li>The same claim as <em>The Wayward Realms</em> (Daggerfall / TES-founder pedigree) - that is team proof, not this product's hook</li>
      </ul>
      <h2>Where to go next</h2>
      <ul>
        <li><a href="${esc(BASE)}/compare/morrowind-like-action-rpg/">Morrowind-like Action RPGs - where TDT sits</a></li>
        <li><a href="${esc(BASE)}/guide/ethno-science-fantasy/">What is ethno-science-fantasy?</a></li>
        <li><a href="${esc(BASE)}/world/peoples/">Peoples</a></li>
        <li><a href="${esc(BASE)}/">Landing</a> - teaser, team, pitch</li>
        <li><a href="${esc(BASE)}/site/#videogame">Full site - video game pillars</a></li>
      </ul>
    </article>`,
      ctaPrimaryHref: `${BASE}/`,
      ctaPrimaryLabel: 'Open the landing',
    }),
    'utf8',
  );

  fs.writeFileSync(
    path.join(root, 'guide', 'index.html'),
    pageShell({
      title: 'Guides | THE DISCORDING TALES',
      description: metaDescription(
        'Guides to The Discording Tales',
        'ethno-science-fantasy, Morrowind / immersive sim Action RPG, and how to start.',
      ),
      canonical: `${BASE}/guide/`,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Guides - The Discording Tales',
        url: `${BASE}/guide/`,
      }),
      bodyHtml: `
        <p class="kicker">Guides</p>
        <h1>Guides</h1>
        <ul class="list">
          <li><a href="${esc(BASE)}/guide/morrowind-immersive-sim-action-rpg/">Morrowind / immersive sim Action RPG</a><p>Built for people still waiting on another Morrowind - play shelf and world close.</p></li>
          <li><a href="${esc(BASE)}/guide/ethno-science-fantasy/">What is ethno-science-fantasy?</a><p>Genre definition and how TDT uses it.</p></li>
        </ul>`,
      ctaPrimaryHref: `${BASE}/guide/morrowind-immersive-sim-action-rpg/`,
      ctaPrimaryLabel: 'Read the Morrowind / imsim guide',
    }),
    'utf8',
  );
  writeManifestFile(path.join(root, 'guide'), guidePaths);

  // --- Character sheet ---
  const sheetPaths = ['/character-sheet/'];
  const sheetDir = path.join(root, 'character-sheet');
  fs.mkdirSync(sheetDir, { recursive: true });
  const sheetCanonical = `${BASE}/character-sheet/`;
  const sheetDesc = metaDescription(
    'Free online character sheet for The Discording Tales tabletop RPG',
    'open the interactive sheet on the main site - no download required.',
  );
  fs.writeFileSync(
    path.join(sheetDir, 'index.html'),
    pageShell({
      title: 'Character sheet | THE DISCORDING TALES',
      description: sheetDesc,
      canonical: sheetCanonical,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'The Discording Tales character sheet',
        description: sheetDesc,
        url: sheetCanonical,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        isPartOf: { '@type': 'WebSite', name: 'THE DISCORDING TALES', url: `${BASE}/` },
      }),
      bodyHtml: `
    <p class="kicker">Play aid</p>
    <h1>Character sheet</h1>
    <p class="lede">A free, browser-based sheet for The Discording Tales tabletop RPG - attributes, peoples, and the living system without printing a blank form first.</p>
    <article>
      <h2>What it is</h2>
      <p>The interactive character sheet lives inside the main site tabletop tools. This page exists so searchers and linkers can find it with a clean URL, then jump straight into play.</p>
      <h2>How to use it</h2>
      <ol>
        <li>Open the sheet on the full site (button below).</li>
        <li>Pick a people and morality that match the table you want.</li>
        <li>Keep the <a href="${esc(BASE)}/world/peoples/">peoples index</a>, <a href="${esc(BASE)}/rules/">rules overview</a>, and <a href="${esc(BASE)}/lore/">lore</a> open while you build.</li>
      </ol>
      <h2>Related</h2>
      <ul>
        <li><a href="${esc(BASE)}/tabletop/">Tabletop book landing</a></li>
        <li><a href="${esc(BASE)}/site/#sheet">Deep link: #sheet</a> on the SPA</li>
        <li><a href="${esc(BASE)}/guide/ethno-science-fantasy/">Ethno-science-fantasy guide</a></li>
      </ul>
    </article>`,
      ctaPrimaryHref: `${BASE}/site/#sheet`,
      ctaPrimaryLabel: 'Open the character sheet',
    }),
    'utf8',
  );
  writeManifestFile(sheetDir, sheetPaths);

  // --- Compare: weird TTRPG + Morrowind-like ARPG ---
  const comparePaths = [
    '/compare/',
    '/compare/weird-fantasy-ttrpg/',
    '/compare/morrowind-like-action-rpg/',
  ];
  fs.mkdirSync(path.join(root, 'compare', 'weird-fantasy-ttrpg'), { recursive: true });
  fs.mkdirSync(path.join(root, 'compare', 'morrowind-like-action-rpg'), { recursive: true });

  const compareCanonical = `${BASE}/compare/weird-fantasy-ttrpg/`;
  const compareDesc = metaDescription(
    'Where The Discording Tales sits among weird fantasy and science-fantasy TTRPGs',
    'no humans, ethnographic depth, dual tabletop and Morrowind-hungry first-person immersive sim Action RPG.',
  );
  fs.writeFileSync(
    path.join(root, 'compare', 'weird-fantasy-ttrpg', 'index.html'),
    pageShell({
      title: 'Weird fantasy TTRPGs - where TDT fits | THE DISCORDING TALES',
      description: compareDesc,
      canonical: compareCanonical,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Weird fantasy TTRPGs - where The Discording Tales fits',
        description: compareDesc,
        url: compareCanonical,
        author: { '@type': 'Organization', name: 'The Discording Tales' },
      }),
      bodyHtml: `
    <p class="kicker">Compare</p>
    <h1>Weird fantasy TTRPGs - where The Discording Tales fits</h1>
    <p class="lede">A category page, not a hit piece. If you are shopping shelves for something stranger than default fantasy, this is the honest positioning.</p>
    <article>
      <h2>The shelf</h2>
      <p>Weird fantasy and science-fantasy TTRPGs usually promise tone: body horror, surreal cities, cosmic dread, or gonzo tech. Many deliver atmosphere. Fewer deliver <em>peoples</em> as the engine - cultures you can argue with at the table, with relations and moralities that are not human cosplay.</p>
      <h2>What TDT optimizes for</h2>
      <ul>
        <li><strong>No humans</strong> - you are always a guest in alien needs</li>
        <li><strong>Ethnographic density</strong> - <a href="${esc(BASE)}/world/peoples/">ten peoples</a>, lineages, and origin myths that are playable</li>
        <li><strong>System + world lock</strong> - lore is not a separate coffee-table book from the <a href="${esc(BASE)}/rules/">rules</a></li>
        <li><strong>Dual path</strong> - <a href="${esc(BASE)}/tabletop/">tabletop early-access book</a> (300+ pages) and a first-person immersive sim Action RPG in development</li>
        <li><strong>Morrowind appetite, not a clone pitch</strong> - see the <a href="${esc(BASE)}/guide/morrowind-immersive-sim-action-rpg/">imsim guide</a> and <a href="${esc(BASE)}/compare/morrowind-like-action-rpg/">ARPG compare</a></li>
        <li><strong>Bilingual hub</strong> - EN/FR site as the canonical discovery surface</li>
      </ul>
      <h2>What it is not</h2>
      <ul>
        <li>A drop-in D&amp;D 5e setting with new monsters</li>
        <li>Cozy pastoral fantasy</li>
        <li>A Vvardenfell reskin - ethno-science-fantasy with no humans is the differentiator once the Morrowind hook lands</li>
        <li>A finished AAA Action RPG you can buy today - the video path is in development; the tabletop book is already in early access</li>
      </ul>
      <h2>Who it is for</h2>
      <p>GMs and players who want cultural friction, golden-age strife, and a living dungeon of alien societies - and Action RPG players still waiting on another Morrowind. Investors and press who want the pitch and team should start at the <a href="${esc(BASE)}/">landing</a>.</p>
      <h2>Start here</h2>
      <ul>
        <li><a href="${esc(BASE)}/guide/ethno-science-fantasy/">What is ethno-science-fantasy?</a></li>
        <li><a href="${esc(BASE)}/tabletop/">Tabletop book</a></li>
        <li><a href="${esc(BASE)}/world/peoples/">Peoples</a></li>
        <li><a href="${esc(BASE)}/character-sheet/">Character sheet</a></li>
      </ul>
    </article>`,
      ctaPrimaryHref: `${BASE}/world/peoples/`,
      ctaPrimaryLabel: 'Meet the peoples',
    }),
    'utf8',
  );

  const arpgCanonical = `${BASE}/compare/morrowind-like-action-rpg/`;
  const arpgDesc = metaDescription(
    'Where The Discording Tales sits among Morrowind-like and immersive sim Action RPGs',
    'first-person freedom, alien cultures, ethno-science-fantasy underworld - not a clone pitch.',
  );
  fs.writeFileSync(
    path.join(root, 'compare', 'morrowind-like-action-rpg', 'index.html'),
    pageShell({
      title: 'Morrowind-like Action RPGs - where TDT fits | THE DISCORDING TALES',
      description: arpgDesc,
      canonical: arpgCanonical,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Morrowind-like Action RPGs - where The Discording Tales fits',
        description: arpgDesc,
        url: arpgCanonical,
        author: { '@type': 'Organization', name: 'The Discording Tales' },
      }),
      bodyHtml: `
    <p class="kicker">Compare</p>
    <h1>Morrowind-like Action RPGs - where The Discording Tales fits</h1>
    <p class="lede">Category positioning for players hunting first-person freedom, alien worlds, and systemic denseness - without pretending every indie with a cliff racer is the same game.</p>
    <article>
      <h2>The shelf people actually search</h2>
      <p>"Spiritual successor to Morrowind," "Elder Scrolls-like," "first-person immersive sim RPG" - these queries share an appetite: weird place, tools that rewrite the map, factions that bite back, lore that behaves like systems. Press still lights up when that promise is clear.</p>
      <h2>How TDT stacks the claim</h2>
      <ol>
        <li><strong>Hook</strong> - Built for people still waiting on another Morrowind.</li>
        <li><strong>Play</strong> - First-person immersive sim action RPG on compact, high-density ground.</li>
        <li><strong>World</strong> - Weird ethno-science-fantasy underworld with <a href="${esc(BASE)}/world/peoples/">no humans</a>.</li>
      </ol>
      <h2>Where peers often stop</h2>
      <ul>
        <li>Aesthetic Morrowind without alien-culture risk</li>
        <li>Open world scale without systemic denseness</li>
        <li>Immersive sim tools without ethnographic moralities</li>
        <li>Tabletop lore dumps with no playable dual path</li>
      </ul>
      <h2>Role-labeled proof refs (not co-headliners)</h2>
      <ul>
        <li>Arx Fatalis - underworld imsim</li>
        <li>Gothic - factions and reputation</li>
        <li>Kenshi - world simulation</li>
      </ul>
      <p>Full write-up: <a href="${esc(BASE)}/guide/morrowind-immersive-sim-action-rpg/">Morrowind / immersive sim guide</a>.</p>
      <h2>Honest status</h2>
      <p>The Action RPG is in development (teaser + pitch on the <a href="${esc(BASE)}/">landing</a>). The <a href="${esc(BASE)}/tabletop/">tabletop early-access book</a> (300+ pages) already ships the same world. Team pedigree includes Once Lost Games / The Wayward Realms - Daggerfall-shaped work stays that project's story.</p>
      <h2>Also see</h2>
      <ul>
        <li><a href="${esc(BASE)}/compare/weird-fantasy-ttrpg/">Weird fantasy TTRPGs</a></li>
        <li><a href="${esc(BASE)}/guide/ethno-science-fantasy/">Ethno-science-fantasy</a></li>
        <li><a href="${esc(BASE)}/site/#videogame">Video game pillars on the full site</a></li>
      </ul>
    </article>`,
      ctaPrimaryHref: `${BASE}/guide/morrowind-immersive-sim-action-rpg/`,
      ctaPrimaryLabel: 'Read the Morrowind / imsim guide',
    }),
    'utf8',
  );

  fs.writeFileSync(
    path.join(root, 'compare', 'index.html'),
    pageShell({
      title: 'Compare | THE DISCORDING TALES',
      description: metaDescription(
        'Comparisons and category pages for The Discording Tales',
        'weird fantasy TTRPGs and Morrowind-like Action RPGs.',
      ),
      canonical: `${BASE}/compare/`,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Compare - The Discording Tales',
        url: `${BASE}/compare/`,
      }),
      bodyHtml: `
        <p class="kicker">Compare</p>
        <h1>Compare</h1>
        <ul class="list">
          <li><a href="${esc(BASE)}/compare/morrowind-like-action-rpg/">Morrowind-like Action RPGs</a><p>First-person imsim shelf and appetite positioning.</p></li>
          <li><a href="${esc(BASE)}/compare/weird-fantasy-ttrpg/">Weird fantasy TTRPGs</a><p>Tabletop category positioning.</p></li>
        </ul>`,
      ctaPrimaryHref: `${BASE}/compare/morrowind-like-action-rpg/`,
      ctaPrimaryLabel: 'Read the ARPG comparison',
    }),
    'utf8',
  );
  writeManifestFile(path.join(root, 'compare'), comparePaths);

  // --- Tabletop book landing ---
  const tabletopPaths = ['/tabletop/'];
  const tabletopDir = path.join(root, 'tabletop');
  fs.mkdirSync(tabletopDir, { recursive: true });
  const tabletopCanonical = `${BASE}/tabletop/`;
  const tabletopDesc = metaDescription(
    'The Discording Tales tabletop RPG book - early access PDF, 300 pages and more',
    'weird ethno-science-fantasy, no humans, rules heavy and procedures light.',
  );
  fs.writeFileSync(
    path.join(tabletopDir, 'index.html'),
    pageShell({
      title: 'Tabletop book | THE DISCORDING TALES',
      description: tabletopDesc,
      canonical: tabletopCanonical,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: 'The Discording Tales',
        alternateName: ['Des Récits Discordants', 'DRD', 'TDT'],
        description: tabletopDesc,
        url: tabletopCanonical,
        bookFormat: 'https://schema.org/EBook',
        inLanguage: ['en', 'fr'],
        genre: ['Tabletop RPG', 'Ethno-science-fantasy', 'Worldbuilding'],
        author: { '@type': 'Person', name: 'Hugues W.B. de Pingon' },
        publisher: { '@type': 'Organization', name: 'The Discording Tales', url: `${BASE}/` },
      }),
      bodyHtml: `
    <p class="kicker">Tabletop</p>
    <h1>Tabletop book - early access</h1>
    <p class="lede">A 300+ page ethno-science-fantasy RPG and worldlore PDF. Rules heavy, procedures light. The same alien underworld as the first-person immersive sim Action RPG in development.</p>
    <article>
      <h2>What you get</h2>
      <ul>
        <li>Playable peoples, moralities, and lineages - <a href="${esc(BASE)}/world/peoples/">browse the peoples index</a></li>
        <li>Cosmology and lore systems - <a href="${esc(BASE)}/lore/">universe lore</a></li>
        <li>System shape - <a href="${esc(BASE)}/rules/">rules overview</a> and the interactive tools on the full site</li>
        <li>Free <a href="${esc(BASE)}/character-sheet/">character sheet</a> in the browser</li>
      </ul>
      <h2>Where to buy / follow</h2>
      <ul>
        <li><a href="https://www.kickstarter.com/projects/1410517588/the-discording-tales-tabletop-rpg-and-worldlore" rel="noopener noreferrer">Kickstarter</a> - tabletop early access</li>
        <li><a href="https://the-discording-tales.itch.io/" rel="noopener noreferrer">itch.io</a></li>
        <li><a href="${esc(BASE)}/site/#tabletop">Full site tabletop tools</a> - rules, zine, sheet, chatbot</li>
      </ul>
      <h2>Dual path</h2>
      <p>Built for people still waiting on another Morrowind on the video side - see the <a href="${esc(BASE)}/guide/morrowind-immersive-sim-action-rpg/">imsim guide</a>. The book is the world you can run at the table today.</p>
    </article>`,
      ctaPrimaryHref: 'https://www.kickstarter.com/projects/1410517588/the-discording-tales-tabletop-rpg-and-worldlore',
      ctaPrimaryLabel: 'Kickstarter - tabletop PDF',
    }),
    'utf8',
  );
  writeManifestFile(tabletopDir, tabletopPaths);

  console.log('Built guide, character-sheet, compare, and tabletop SEO pages');
}

build();
