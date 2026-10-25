/**
 * Static SEO guides: ethno-science-fantasy pillar, character-sheet tool, category compare.
 * Note: URL /character-sheet/ (not /tools/...) - repo root already uses tools/ for build scripts.
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
  // --- Guide pillar ---
  const guidePaths = ['/guide/', '/guide/ethno-science-fantasy/'];
  fs.mkdirSync(path.join(root, 'guide', 'ethno-science-fantasy'), { recursive: true });
  const guideCanonical = `${BASE}/guide/ethno-science-fantasy/`;
  const guideDesc = metaDescription(
    'Ethno-science-fantasy is the genre frame of The Discording Tales',
    'alien cultures, inverted matter, and playable moralities without humans.',
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
      <p>High fantasy often centers a human (or human-adjacent) moral default and a familiar medieval toolkit. Ethno-science-fantasy starts from other peoples - <a href="${esc(BASE)}/world/peoples/">Yômmes, Yôrres, Bêstres and their nations</a> - and asks what growth, wisdom, joy, or competence mean when the body and the Ril are not yours.</p>
      <h2>How it differs from soft science fantasy</h2>
      <p>Science fantasy can mean lasers on dragons. Here the "science" is diegetic: crystal forests where matter inverts, abundances and festivals named as forces, artefacts and orders that structure play. The wonder is ethnographic and systemic, not only spectacle.</p>
      <h2>What you can explore next</h2>
      <ul>
        <li><a href="${esc(BASE)}/world/origins/">Three origins</a> - how peoples returned from the crust</li>
        <li><a href="${esc(BASE)}/world/peoples/">Peoples index</a> - moralities, lineages, relations</li>
        <li><a href="${esc(BASE)}/lore/">Universe lore</a> - Rildées, festivals, artefacts</li>
        <li><a href="${esc(BASE)}/compare/weird-fantasy-ttrpg/">Weird fantasy TTRPGs</a> - where TDT sits on the shelf</li>
        <li><a href="${esc(BASE)}/character-sheet/">Character sheet</a> - play aids on the site</li>
      </ul>
      <h2>Dual path</h2>
      <p>The same world is a <strong>tabletop book</strong> (early-access PDF, 300 pages and more) and an <strong>Action RPG</strong> in development. The public site is the bilingual hub for both.</p>
    </article>`,
      ctaPrimaryHref: `${BASE}/world/peoples/`,
      ctaPrimaryLabel: 'Browse peoples',
    }),
    'utf8',
  );
  fs.writeFileSync(
    path.join(root, 'guide', 'index.html'),
    pageShell({
      title: 'Guides | THE DISCORDING TALES',
      description: metaDescription(
        'Guides to The Discording Tales',
        'ethno-science-fantasy, peoples, and how to start.',
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
          <li><a href="${esc(BASE)}/guide/ethno-science-fantasy/">What is ethno-science-fantasy?</a><p>Genre definition and how TDT uses it.</p></li>
        </ul>`,
      ctaPrimaryHref: `${BASE}/guide/ethno-science-fantasy/`,
      ctaPrimaryLabel: 'Read the guide',
    }),
    'utf8',
  );
  writeManifestFile(path.join(root, 'guide'), guidePaths);

  // --- Character sheet (free tool landing) ---
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
        <li>Keep the <a href="${esc(BASE)}/world/peoples/">peoples index</a> and <a href="${esc(BASE)}/lore/">lore</a> open in another tab while you build.</li>
      </ol>
      <h2>Related</h2>
      <ul>
        <li><a href="${esc(BASE)}/#sheet">Deep link: #sheet</a> on the SPA</li>
        <li><a href="${esc(BASE)}/guide/ethno-science-fantasy/">Ethno-science-fantasy guide</a></li>
        <li><a href="${esc(BASE)}/landing">Project landing</a> - book, pitch, team</li>
      </ul>
    </article>`,
      ctaPrimaryHref: `${BASE}/#sheet`,
      ctaPrimaryLabel: 'Open the character sheet',
    }),
    'utf8',
  );
  writeManifestFile(sheetDir, sheetPaths);

  // --- Category compare ---
  const comparePaths = ['/compare/', '/compare/weird-fantasy-ttrpg/'];
  fs.mkdirSync(path.join(root, 'compare', 'weird-fantasy-ttrpg'), { recursive: true });
  const compareCanonical = `${BASE}/compare/weird-fantasy-ttrpg/`;
  const compareDesc = metaDescription(
    'Where The Discording Tales sits among weird fantasy and science-fantasy TTRPGs',
    'no humans, ethnographic depth, dual tabletop and Action RPG path.',
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
        <li><strong>System + world lock</strong> - lore is not a separate coffee-table book from the rules</li>
        <li><strong>Dual path</strong> - tabletop early-access book (300+ pages) and an Action RPG in development</li>
        <li><strong>Bilingual hub</strong> - EN/FR site as the canonical discovery surface</li>
      </ul>
      <h2>What it is not</h2>
      <ul>
        <li>A drop-in D&amp;D 5e setting with new monsters</li>
        <li>Cozy pastoral fantasy</li>
        <li>A finished AAA Action RPG you can buy today - the video path is in development; the tabletop book is already in early access</li>
      </ul>
      <h2>Who it is for</h2>
      <p>GMs and players who want cultural friction, golden-age strife, and a living dungeon of alien societies. Investors and press who want the pitch and team should start at the <a href="${esc(BASE)}/landing">landing</a>.</p>
      <h2>Start here</h2>
      <ul>
        <li><a href="${esc(BASE)}/guide/ethno-science-fantasy/">What is ethno-science-fantasy?</a></li>
        <li><a href="${esc(BASE)}/world/peoples/">Peoples</a></li>
        <li><a href="${esc(BASE)}/lore/">Universe lore</a></li>
        <li><a href="${esc(BASE)}/character-sheet/">Character sheet</a></li>
      </ul>
    </article>`,
      ctaPrimaryHref: `${BASE}/world/peoples/`,
      ctaPrimaryLabel: 'Meet the peoples',
    }),
    'utf8',
  );
  fs.writeFileSync(
    path.join(root, 'compare', 'index.html'),
    pageShell({
      title: 'Compare | THE DISCORDING TALES',
      description: metaDescription('Comparisons and category pages for The Discording Tales.'),
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
          <li><a href="${esc(BASE)}/compare/weird-fantasy-ttrpg/">Weird fantasy TTRPGs</a><p>Category positioning for The Discording Tales.</p></li>
        </ul>`,
      ctaPrimaryHref: `${BASE}/compare/weird-fantasy-ttrpg/`,
      ctaPrimaryLabel: 'Read the comparison',
    }),
    'utf8',
  );
  writeManifestFile(path.join(root, 'compare'), comparePaths);

  console.log('Built guide, character-sheet, and compare SEO pages');
}

build();
