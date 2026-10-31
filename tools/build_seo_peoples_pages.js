/**
 * Programmatic SEO: /world/peoples/ + /world/origins/ from peoples cards + locales/en.json.
 * Run: node tools/build_seo_peoples_pages.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BASE,
  esc,
  formatRaceBlurb,
  metaDescription,
  noEmDash,
  originSeoSlug,
  pageShell,
  peopleSeoSlug,
  plainText,
  redirectShell,
  resolveI18n,
  writeManifestFile,
} from './seo-shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const cardsPath = path.join(root, 'partials', 'peoples-cards.html');
const enPath = path.join(root, 'locales', 'en.json');
const worldDir = path.join(root, 'world');
const peoplesDir = path.join(worldDir, 'peoples');
const originsDir = path.join(worldDir, 'origins');

const ORIGIN_META = {
  yommes: {
    titleKey: 'peoples.descent.yommes.title',
    howKey: 'peoples.descent.yommes.how',
    bodyKey: 'peoples.descent.yommes.body',
    fromKey: 'peoples.origins.yommes_from',
    akaKey: 'peoples.origins.yommes_aka',
    badge: 'YUMS',
    image: 'Yums.webp',
  },
  yorres: {
    titleKey: 'peoples.descent.yorres.title',
    howKey: 'peoples.descent.yorres.how',
    bodyKey: 'peoples.descent.yorres.body',
    fromKey: 'peoples.origins.yorres_from',
    badge: 'YORS',
    image: 'Yors.webp',
  },
  bestres: {
    titleKey: 'peoples.descent.bestres.title',
    howKey: 'peoples.descent.bestres.how',
    bodyKey: 'peoples.descent.bestres.body',
    fromKey: 'peoples.origins.bestres_from',
    badge: 'BEINGSTS',
    image: 'Beingsts.webp',
  },
};

function parseCards(html, en) {
  const chunks = html.split(/<div class="peoples-flip-card genre-card"/).slice(1);
  return chunks.map((chunk) => {
    const slug = (chunk.match(/data-peuple="([^"]+)"/) || [])[1];
    const origin = (chunk.match(/data-origin="([^"]+)"/) || [])[1];
    const front = chunk.slice(0, chunk.indexOf('peoples-flip-back'));
    const back = chunk.slice(chunk.indexOf('peoples-flip-back'));
    const name = plainText(resolveI18n((front.match(/<h5[^>]*>([\s\S]*?)<\/h5>/) || [])[1] || '', en));
    const hook = plainText(resolveI18n((front.match(/peoples-hook[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '', en));
    const moralityRaw = resolveI18n((front.match(/peoples-morality-line[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '', en);
    const morality = plainText(moralityRaw);
    const races = [...front.matchAll(/<li\s+([^>]*)>([\s\S]*?)<\/li>/g)].map((m) => {
      const attrs = m[1];
      const label = plainText(resolveI18n(m[2], en));
      const titleKey = (attrs.match(/\{\{i18n-title:([^}]+)\}\}/) || [])[1];
      const blurb = titleKey && en[titleKey] ? noEmDash(en[titleKey]) : '';
      return { label, titleKey, blurb };
    });
    const attrTable = resolveI18n(
      (back.match(/<table class="lore-table peoples-attr-table[\s\S]*?<\/table>/) || [])[0] || '',
      en,
    );
    const physTable = resolveI18n(
      (back.match(/<table class="lore-table peoples-phys-table[\s\S]*?<\/table>/) || [])[0] || '',
      en,
    );
    const competences = resolveI18n(
      (back.match(/<table class="lore-table peoples-competences-table[\s\S]*?<\/table>/) || [])[0] || '',
      en,
    );
    const relKey = `peoples.relations.${slug.replace(/-/g, '_')}`;
    const relations = noEmDash(en[relKey] || '');
    return {
      slug,
      origin,
      name,
      hook,
      morality,
      races,
      attrTable,
      physTable,
      competences,
      relations,
    };
  }).filter((p) => p.slug && p.name);
}

function build() {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const html = fs.readFileSync(cardsPath, 'utf8');
  const peoples = parseCards(html, en);
  if (peoples.length < 8) {
    console.error('Expected ~10 peoples, got', peoples.length);
    process.exit(1);
  }

  fs.mkdirSync(peoplesDir, { recursive: true });
  fs.mkdirSync(originsDir, { recursive: true });

  const paths = ['/world/', '/world/peoples/', '/world/origins/'];

  // World hub
  const worldBody = `
    <p class="kicker">World</p>
    <h1>Peoples and origins of The Discording Tales</h1>
    <p class="lede">No humans. Three origins - Yums, Yors, Beingsts - and the peoples that climbed back from the crust with their own moralities, lineages, and wars.</p>
    <h2>Browse</h2>
    <ul class="list">
      <li><a href="${esc(BASE)}/world/peoples/">All peoples</a><p>Ten playable peoples with tribes, attributes, and relations.</p></li>
      <li><a href="${esc(BASE)}/world/origins/">Three origins</a><p>How Yums, Yors, and Beingsts came to the surface.</p></li>
      <li><a href="${esc(BASE)}/lore/">Universe lore</a><p>Rildées, festivals, artefacts, and cosmology.</p></li>
      <li><a href="${esc(BASE)}/rules/">Rules overview</a><p>Attributes and how the tabletop system hangs together.</p></li>
      <li><a href="${esc(BASE)}/guide/ethno-science-fantasy/">What is ethno-science-fantasy?</a><p>The genre frame for this setting.</p></li>
      <li><a href="${esc(BASE)}/guide/morrowind-immersive-sim-action-rpg/">Morrowind / immersive sim Action RPG</a><p>Why the video game is built for that appetite.</p></li>
    </ul>`;
  fs.writeFileSync(
    path.join(worldDir, 'index.html'),
    pageShell({
      title: 'World & peoples | THE DISCORDING TALES',
      description: metaDescription(
        'Explore the peoples and three origins of The Discording Tales',
        'an ethno-science-fantasy world without humans.',
      ),
      canonical: `${BASE}/world/`,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'World & peoples - The Discording Tales',
        url: `${BASE}/world/`,
        isPartOf: { '@type': 'WebSite', name: 'THE DISCORDING TALES', url: `${BASE}/` },
      }),
      bodyHtml: worldBody,
      ctaPrimaryHref: `${BASE}/site/#peoples`,
      ctaPrimaryLabel: 'Open peoples in the world',
    }),
    'utf8',
  );

  // Peoples hub
  const byOrigin = { yommes: [], yorres: [], bestres: [] };
  for (const p of peoples) {
    (byOrigin[p.origin] || (byOrigin[p.origin] = [])).push(p);
  }

  const peoplesList = peoples
    .map((p) => {
      const seo = peopleSeoSlug(p.slug);
      return `<li><a href="${esc(BASE)}/world/peoples/${esc(seo)}/">${esc(p.name)}</a><p>${esc(p.hook)} ${esc(p.morality)}</p></li>`;
    })
    .join('\n');

  const peoplesHubBody = `
    <p class="kicker"><a href="${esc(BASE)}/world/">World</a></p>
    <h1>Peoples of The Discording Tales</h1>
    <p class="lede">${esc(en['peoples.descent.lead'] || '')}</p>
    <ul class="list">
${peoplesList}
    </ul>
    <h2>By origin</h2>
    <p class="related">
      <a href="${esc(BASE)}/world/origins/yums/">Yums</a>
      <a href="${esc(BASE)}/world/origins/yors/">Yors</a>
      <a href="${esc(BASE)}/world/origins/beingsts/">Beingsts</a>
    </p>`;

  const peoplesItemList = peoples.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${BASE}/world/peoples/${peopleSeoSlug(p.slug)}/`,
    name: p.name,
  }));

  fs.writeFileSync(
    path.join(peoplesDir, 'index.html'),
    pageShell({
      title: 'Peoples | THE DISCORDING TALES',
      description: metaDescription(
        'Meet the peoples of The Discording Tales',
        'Aristese, Greyscribes, Great Ylves, Slaadeans, and more - alien cultures with playable moralities.',
      ),
      canonical: `${BASE}/world/peoples/`,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Peoples - The Discording Tales',
        url: `${BASE}/world/peoples/`,
        mainEntity: { '@type': 'ItemList', itemListElement: peoplesItemList },
      }),
      bodyHtml: peoplesHubBody,
      ctaPrimaryHref: `${BASE}/site/#peoples`,
      ctaPrimaryLabel: 'Open peoples in the world',
    }),
    'utf8',
  );
  // Per-people pages (EN SEO slug canonical; legacy FR slug ? redirect)
  for (const p of peoples) {
    const seoSlug = peopleSeoSlug(p.slug);
    const originEn = originSeoSlug(p.origin);
    const originLabel = en[ORIGIN_META[p.origin]?.titleKey] || p.origin;
    paths.push(`/world/peoples/${seoSlug}/`);

    const raceBlocks = p.races
      .map((r) => {
        const body = formatRaceBlurb(r.blurb);
        return `<section class="race"><h3>${esc(r.label)}</h3>${body || `<p>${esc(r.label)} lineage of the ${esc(p.name)}.</p>`}</section>`;
      })
      .join('\n');

    const siblings = peoples
      .filter((x) => x.origin === p.origin && x.slug !== p.slug)
      .map((x) => `<a href="${esc(BASE)}/world/peoples/${esc(peopleSeoSlug(x.slug))}/">${esc(x.name)}</a>`)
      .join(' ');

    const description = metaDescription(
      `${p.name} in The Discording Tales`,
      p.hook,
      p.morality,
      `Origin: ${originLabel}.`,
    );

    const articleBody = `
    <p class="kicker"><a href="${esc(BASE)}/world/peoples/">Peoples</a> · <a href="${esc(BASE)}/world/origins/${esc(originEn)}/">${esc(originLabel)}</a></p>
    <h1>${esc(p.name)}</h1>
    <p>
      <span class="meta-chip">${esc(ORIGIN_META[p.origin]?.badge || originLabel)}</span>
      <span class="meta-chip">${esc(p.morality)}</span>
    </p>
    <p class="lede">${esc(p.hook)}</p>
    <article>
      <h2>In the setting</h2>
      <p>The <strong>${esc(p.name)}</strong> are a people of the <a href="${esc(BASE)}/world/origins/${esc(originEn)}/">${esc(originLabel)}</a> origin in The Discording Tales / Des Récits Discordants - an ethno-science-fantasy world without humans. Their racial morality is framed as <strong>${esc(p.morality)}</strong>.</p>
      ${p.relations ? `<h2>Relations</h2><p>${esc(p.relations)}</p>` : ''}
      <h2>Lineages</h2>
      ${raceBlocks || '<p>See the interactive peoples tree on the main site for lineage detail.</p>'}
      ${p.attrTable ? `<h2>Attributes</h2>${p.attrTable}` : ''}
      ${p.physTable ? `<h2>Physical</h2>${p.physTable}` : ''}
      ${p.competences ? `<h2>Competences</h2>${p.competences}` : ''}
      ${siblings ? `<h2>Other ${esc(originLabel)}</h2><p class="related">${siblings}</p>` : ''}
    </article>`;

    const dir = path.join(peoplesDir, seoSlug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      pageShell({
        title: `${p.name} | Peoples | THE DISCORDING TALES`,
        description,
        canonical: `${BASE}/world/peoples/${seoSlug}/`,
        jsonLd: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: p.name,
          description,
          about: { '@type': 'Thing', name: p.name },
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
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${BASE}/world/peoples/${seoSlug}/`,
          },
          url: `${BASE}/world/peoples/${seoSlug}/`,
        }),
        bodyHtml: articleBody,
        ctaPrimaryHref: `${BASE}/site/#peoples`,
        ctaPrimaryLabel: `Open ${p.name} in the world`,
      }),
      'utf8',
    );

    if (seoSlug !== p.slug) {
      const legacyDir = path.join(peoplesDir, p.slug);
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.writeFileSync(
        path.join(legacyDir, 'index.html'),
        redirectShell({
          to: `${BASE}/world/peoples/${seoSlug}/`,
          title: `${p.name} moved | THE DISCORDING TALES`,
        }),
        'utf8',
      );
    }
  }

  // Origins hub + pages
  const originsHubBody = `
    <p class="kicker"><a href="${esc(BASE)}/world/">World</a></p>
    <h1>Three origins</h1>
    <p class="lede">${esc(en['peoples.descent.lead'] || '')}</p>
    <ul class="list origin-list">
      ${['yommes', 'yorres', 'bestres']
        .map((id) => {
          const m = ORIGIN_META[id];
          const enSlug = originSeoSlug(id);
          const title = en[m.titleKey];
          const how = en[m.howKey];
          const thumbClass =
            enSlug === 'yums'
              ? 'origin-thumb origin-thumb--yums'
              : enSlug === 'beingsts'
                ? 'origin-thumb origin-thumb--beingsts'
                : 'origin-thumb';
          const img = m.image
            ? `<img class="${thumbClass}" src="${esc(BASE)}/assets/images/people/${esc(m.image)}" alt="${esc(title)} origin figure from The Discording Tales" width="320" height="320" loading="lazy" decoding="async"/>`
            : '';
          return `<li><a href="${esc(BASE)}/world/origins/${enSlug}/">${img}<span class="origin-list__text"><strong>${esc(title)}</strong><p>${esc(how)} - ${esc(en[m.fromKey] || '')}</p></span></a></li>`;
        })
        .join('\n')}
    </ul>`;

  fs.writeFileSync(
    path.join(originsDir, 'index.html'),
    pageShell({
      title: 'Three origins | THE DISCORDING TALES',
      description: metaDescription(
        'Yums, Yors, and Beingsts',
        'the three origins of peoples in The Discording Tales ethno-science-fantasy setting.',
      ),
      canonical: `${BASE}/world/origins/`,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Three origins - The Discording Tales',
        url: `${BASE}/world/origins/`,
      }),
      bodyHtml: originsHubBody,
      ctaPrimaryHref: `${BASE}/site/#peoples`,
      ctaPrimaryLabel: 'Open peoples in the world',
    }),
    'utf8',
  );

  for (const id of ['yommes', 'yorres', 'bestres']) {
    const m = ORIGIN_META[id];
    const enSlug = originSeoSlug(id);
    const title = en[m.titleKey];
    const body = en[m.bodyKey];
    const how = en[m.howKey];
    const from = en[m.fromKey] || '';
    const aka = m.akaKey ? en[m.akaKey] : '';
    const members = byOrigin[id] || [];
    const memberLinks = members
      .map(
        (p) =>
          `<li><a href="${esc(BASE)}/world/peoples/${esc(peopleSeoSlug(p.slug))}/">${esc(p.name)}</a> - ${esc(p.hook)}</li>`,
      )
      .join('\n');
    const description = metaDescription(title, how, from, 'in The Discording Tales.');
    paths.push(`/world/origins/${enSlug}/`);

    const heroMod =
      enSlug === 'yums' ? ' origin-hero--yums' : enSlug === 'beingsts' ? ' origin-hero--beingsts' : '';
    const hero = m.image
      ? `<figure class="origin-hero${heroMod}"><img src="${esc(BASE)}/assets/images/people/${esc(m.image)}" alt="${esc(title)} origin figure from The Discording Tales ethno-science-fantasy setting" width="900" height="900" loading="eager" decoding="async"/></figure>`
      : '';
    const originBody = `
    <p class="kicker"><a href="${esc(BASE)}/world/origins/">Origins</a></p>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(how)}${from ? ` - ${esc(from)}` : ''}${aka ? ` (${esc(aka)})` : ''}</p>
    ${hero}
    <article>
      <p>${esc(body)}</p>
      <h2>Peoples of this origin</h2>
      <ul>${memberLinks}</ul>
    </article>`;

    const dir = path.join(originsDir, enSlug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      pageShell({
        title: `${title} | Origins | THE DISCORDING TALES`,
        description,
        canonical: `${BASE}/world/origins/${enSlug}/`,
        jsonLd: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          url: `${BASE}/world/origins/${enSlug}/`,
          isPartOf: { '@type': 'WebSite', name: 'THE DISCORDING TALES', url: `${BASE}/` },
          ...(m.image
            ? {
                image: [
                  `${BASE}/assets/images/people/${m.image}`,
                  `${BASE}/assets/og-tdt-1200x630.jpg`,
                ],
              }
            : {}),
        }),
        bodyHtml: originBody,
        ctaPrimaryHref: `${BASE}/site/#peoples`,
        ctaPrimaryLabel: 'Open peoples in the world',
      }),
      'utf8',
    );

    if (enSlug !== id) {
      const legacyDir = path.join(originsDir, id);
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.writeFileSync(
        path.join(legacyDir, 'index.html'),
        redirectShell({
          to: `${BASE}/world/origins/${enSlug}/`,
          title: `${title} moved | THE DISCORDING TALES`,
        }),
        'utf8',
      );
    }
  }

  writeManifestFile(worldDir, paths);
  console.log(`Built world SEO: ${peoples.length} peoples + 3 origins + hubs`);
}

build();
