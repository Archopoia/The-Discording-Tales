/**
 * Programmatic SEO: indexable /lore/ pages from public/data/universe-lore-en.json.
 * Run: node tools/build_seo_lore_pages.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BASE,
  esc,
  metaDescription,
  pageShell,
  plainText,
  writeManifestFile,
} from './seo-shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const loreJsonPath = path.join(root, 'public', 'data', 'universe-lore-en.json');
const outDir = path.join(root, 'lore');

function build() {
  if (!fs.existsSync(loreJsonPath)) {
    console.error('Missing', loreJsonPath);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(loreJsonPath, 'utf8'));
  const entries = data.entries || {};
  const slugs = Object.keys(entries).sort();
  if (!slugs.length) {
    console.error('No lore entries found');
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const paths = ['/lore/', ...slugs.map((s) => `/lore/${s}/`)];

  const itemList = slugs.map((slug, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${BASE}/lore/${slug}/`,
    name: entries[slug].summary || slug,
  }));

  const hubList = slugs
    .map((slug) => {
      const summary = entries[slug].summary || slug;
      const desc = metaDescription(summary, plainText(entries[slug].bodyHtml));
      return `<li><a href="${esc(BASE)}/lore/${esc(slug)}/">${esc(summary)}</a><p>${esc(desc.slice(0, 160))}</p></li>`;
    })
    .join('\n');

  fs.writeFileSync(
    path.join(outDir, 'index.html'),
    pageShell({
      title: 'Universe lore | THE DISCORDING TALES',
      description: metaDescription(
        'Browse universe lore from The Discording Tales',
        'Rildées, abundances, festivals, artefacts, and more from the ethno-science-fantasy setting.',
      ),
      canonical: `${BASE}/lore/`,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Universe lore - The Discording Tales',
        description:
          'Indexable universe lore from The Discording Tales: astral Rildées, abundances, festivals, artefacts, and the ethno-science-fantasy setting.',
        url: `${BASE}/lore/`,
        isPartOf: { '@type': 'WebSite', name: 'THE DISCORDING TALES', url: `${BASE}/` },
        mainEntity: { '@type': 'ItemList', itemListElement: itemList },
      }),
      bodyHtml: `
    <p class="kicker">Universe lore</p>
    <h1>Lore of The Discording Tales</h1>
    <p class="lede">Proprietary setting texts from the ethno-science-fantasy world - readable here for search and citation, and inside the interactive site.</p>
    <p class="related"><a href="${esc(BASE)}/world/peoples/">Peoples</a> <a href="${esc(BASE)}/guide/ethno-science-fantasy/">Ethno-science-fantasy guide</a></p>
    <ul class="list">
${hubList}
    </ul>`,
      ctaPrimaryHref: `${BASE}/site/#universe-lore`,
      ctaPrimaryLabel: 'Open lore in the world',
    }),
    'utf8',
  );

  for (const slug of slugs) {
    const entry = entries[slug];
    const summary = entry.summary || slug;
    const description = metaDescription(summary, plainText(entry.bodyHtml));
    const canonical = `${BASE}/lore/${slug}/`;
    const dir = path.join(outDir, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      pageShell({
        title: `${summary} | THE DISCORDING TALES`,
        description,
        canonical,
        jsonLd: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: summary,
          description,
          inLanguage: 'en',
          image: [
            `${BASE}/assets/og-tdt-1200x630.jpg`,
            `${BASE}/assets/og/tdt-brand-square-600.jpg`,
          ],
          datePublished: '2020-01-01T00:00:00+00:00',
          dateModified: new Date().toISOString(),
          isPartOf: { '@type': 'WebSite', name: 'THE DISCORDING TALES', url: `${BASE}/` },
          author: {
            '@type': 'Organization',
            name: 'The Discording Tales',
            url: `${BASE}/`,
          },
          publisher: {
            '@type': 'Organization',
            name: 'The Discording Tales',
            logo: {
              '@type': 'ImageObject',
              url: `${BASE}/assets/og/tdt-brand-square-512.jpg`,
              width: 512,
              height: 512,
            },
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
          url: canonical,
        }),
        bodyHtml: `
    <p class="kicker"><a href="${esc(BASE)}/lore/">Universe lore</a></p>
    <h1>${esc(summary)}</h1>
    <article>
      ${entry.bodyHtml || ''}
    </article>`,
        ctaPrimaryHref: `${BASE}/site/#universe-lore`,
        ctaPrimaryLabel: 'Open lore in the world',
      }),
      'utf8',
    );
  }

  writeManifestFile(outDir, paths);
  console.log(`Built ${slugs.length} lore pages + hub at lore/`);
}

build();
