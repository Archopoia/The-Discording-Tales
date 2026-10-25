/**
 * Shared helpers for indexable SEO HTML pages (lore, peoples, guides).
 */
import fs from 'fs';
import path from 'path';
import { getSitePublicBase } from './site-public-url.js';

export const BASE = getSitePublicBase();

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Project rule: no em dash; normalize en/em dashes in generated copy. */
export function noEmDash(s) {
  return String(s)
    .replace(/\u2014/g, ' - ')
    .replace(/\u2013/g, ' - ')
    .replace(/\s+-\s+/g, ' - ');
}

export function plainText(html) {
  return noEmDash(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export function metaDescription(...parts) {
  const raw = noEmDash(
    parts
      .filter(Boolean)
      .map((p) => String(p).trim())
      .map((p) => (/[.!?]$/.test(p) ? p : `${p}.`))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  if (raw.length <= 158) return raw;
  return `${raw.slice(0, 155).replace(/\s+\S*$/, '')}...`;
}

export function resolveI18n(str, dict) {
  return noEmDash(
    String(str || '')
      .replace(/\{\{i18n:([^}]+)\}\}/g, (_, k) => dict[k] ?? '')
      .replace(/\{\{i18n-title:([^}]+)\}\}/g, (_, k) => dict[k] ?? '')
      .replace(/\{\{i18n-aria:[^}]+\}\}/g, ''),
  );
}

/**
 * @param {{ title: string, description: string, canonical: string, jsonLd: string, bodyHtml: string, navExtra?: string, ctaPrimaryHref?: string, ctaPrimaryLabel?: string, ogType?: string }} opts
 */
export function pageShell(opts) {
  const {
    title,
    description,
    canonical,
    jsonLd,
    bodyHtml,
    navExtra = '',
    ctaPrimaryHref = `${BASE}/#peoples`,
    ctaPrimaryLabel = 'Open peoples in the world',
    ogType = 'article',
  } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}"/>
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
  <meta name="author" content="The Discording Tales / Des Récits Discordants"/>
  <link rel="canonical" href="${esc(canonical)}"/>
  <link rel="alternate" href="${esc(canonical)}" hreflang="en"/>
  <link rel="alternate" href="${esc(canonical)}" hreflang="x-default"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(description)}"/>
  <meta property="og:type" content="${esc(ogType)}"/>
  <meta property="og:url" content="${esc(canonical)}"/>
  <meta property="og:site_name" content="THE DISCORDING TALES"/>
  <meta property="og:locale" content="en_US"/>
  <meta property="og:image" content="${esc(BASE)}/assets/og-tdt-1200x630.jpg"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(description)}"/>
  <meta name="twitter:image" content="${esc(BASE)}/assets/og-tdt-1200x630.jpg"/>
  <meta name="theme-color" content="#5a1f1f"/>
  <link rel="icon" href="${esc(BASE)}/assets/icons/favicon-48x48.png" type="image/png" sizes="48x48"/>
  <link rel="icon" href="${esc(BASE)}/favicon.ico" sizes="48x48"/>
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    :root { color-scheme: light only; --bg:#1a0f10; --ink:#f3e6d8; --muted:#c9b4a0; --gold:#c9a227; --line:rgba(201,162,39,.35); }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Georgia, "Times New Roman", serif; background: radial-gradient(1200px 600px at 50% -10%, #3a1a1c, var(--bg)); color: var(--ink); line-height: 1.65; }
    a { color: var(--gold); }
    .wrap { max-width: 44rem; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }
    .site-bar { display:flex; flex-wrap:wrap; gap:.75rem 1.25rem; align-items:baseline; margin-bottom: 2rem; padding-bottom: .75rem; border-bottom: 1px solid var(--line); font-size: .95rem; }
    .site-bar .brand { font-weight: 700; letter-spacing: .04em; text-decoration: none; color: var(--ink); }
    .kicker { color: var(--muted); font-size: .85rem; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 .5rem; }
    h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); line-height: 1.2; margin: 0 0 1rem; }
    h2 { font-size: 1.25rem; margin: 2rem 0 .75rem; }
    h3 { font-size: 1.1rem; margin: 1.5rem 0 .5rem; }
    .lede { color: var(--muted); font-size: 1.05rem; margin: 0 0 1.5rem; }
    article :is(p, li) { font-size: 1.05rem; }
    article ul { padding-left: 1.2rem; }
    .meta-chip { display:inline-block; margin: 0 .5rem .5rem 0; padding: .2rem .55rem; border: 1px solid var(--line); color: var(--muted); font-size: .85rem; }
    table { width: 100%; border-collapse: collapse; margin: .75rem 0 1.25rem; font-size: .95rem; }
    th, td { border: 1px solid var(--line); padding: .4rem .55rem; text-align: left; }
    th { color: var(--muted); font-weight: 600; }
    .race { margin: 0 0 1.75rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--line); }
    .race:last-child { border-bottom: 0; }
    .cta { margin: 2.5rem 0 0; padding: 1.25rem; border: 1px solid var(--line); background: rgba(0,0,0,.25); }
    .cta p { margin: 0 0 .75rem; color: var(--muted); }
    .cta .row { display:flex; flex-wrap:wrap; gap: .75rem; }
    .btn { display:inline-block; padding: .55rem 1rem; border: 1px solid var(--gold); color: var(--ink); text-decoration:none; background: rgba(201,162,39,.12); }
    .btn-ghost { border-color: var(--line); background: transparent; }
    .list { list-style: none; padding: 0; margin: 1.5rem 0 0; }
    .list li { margin: 0 0 .85rem; padding-bottom: .85rem; border-bottom: 1px solid var(--line); }
    .list a { text-decoration: none; font-size: 1.1rem; }
    .list p { margin: .35rem 0 0; color: var(--muted); font-size: .95rem; }
    .related { display:flex; flex-wrap:wrap; gap: .5rem .85rem; margin: .75rem 0 0; }
    footer { margin-top: 3rem; color: var(--muted); font-size: .85rem; }
    footer a { margin-right: .35rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <nav class="site-bar" aria-label="Site">
      <a class="brand" href="${esc(BASE)}/">THE DISCORDING TALES</a>
      <a href="${esc(BASE)}/world/peoples/">Peoples</a>
      <a href="${esc(BASE)}/lore/">Lore</a>
      <a href="${esc(BASE)}/guide/ethno-science-fantasy/">Guide</a>
      <a href="${esc(BASE)}/landing">Landing</a>
      ${navExtra}
    </nav>
    ${bodyHtml}
    <aside class="cta" aria-label="Continue">
      <p>Explore the living world in the full site, or follow the launch.</p>
      <div class="row">
        <a class="btn" href="${esc(ctaPrimaryHref)}">${esc(ctaPrimaryLabel)}</a>
        <a class="btn btn-ghost" href="https://discord.gg/a4GSWYVH7V" rel="noopener noreferrer">Discord</a>
        <a class="btn btn-ghost" href="https://www.kickstarter.com/projects/1410517588/the-discording-tales-tabletop-rpg-and-worldlore" rel="noopener noreferrer">Kickstarter</a>
      </div>
    </aside>
    <footer>
      <p>The Discording Tales / Des Récits Discordants - ethno-science-fantasy Action RPG &amp; tabletop book.</p>
      <p>
        <a href="${esc(BASE)}/world/peoples/">Peoples</a> ·
        <a href="${esc(BASE)}/lore/">Lore</a> ·
        <a href="${esc(BASE)}/guide/ethno-science-fantasy/">Guide</a> ·
        <a href="${esc(BASE)}/character-sheet/">Character sheet</a> ·
        <a href="${esc(BASE)}/compare/weird-fantasy-ttrpg/">Compare</a> ·
        <a href="${esc(BASE)}/privacy">Privacy</a> ·
        <a href="${esc(BASE)}/impressum">Impressum</a>
      </p>
    </footer>
  </div>
</body>
</html>
`;
}

export function writeManifestFile(outDir, paths) {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = {
    generatedAt: new Date().toISOString(),
    paths: [...new Set(paths)],
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

export function formatRaceBlurb(text) {
  const t = noEmDash(text || '').trim();
  if (!t) return '';
  const parts = t.split(/\n\n+/);
  return parts
    .map((p) => {
      const lines = p.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 1 && !lines[0].startsWith('•')) {
        return `<p>${esc(lines[0])}</p>`;
      }
      const bullets = lines.filter((l) => l.startsWith('•') || l.startsWith('-'));
      const prose = lines.filter((l) => !l.startsWith('•') && !l.startsWith('-'));
      let html = prose.map((l) => `<p>${esc(l)}</p>`).join('\n');
      if (bullets.length) {
        html += `<ul>${bullets.map((l) => `<li>${esc(l.replace(/^[•\-]\s*/, ''))}</li>`).join('')}</ul>`;
      }
      return html;
    })
    .join('\n');
}
