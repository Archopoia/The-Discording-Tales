/**
 * Writes sitemap.xml at repo root for GitHub Pages.
 * - One canonical URL (hash-only SPA sections are not separate sitemap URLs; Google ignores fragments).
 * - hreflang alternates (en / fr / x-default) on the same URL for the bilingual toggle UI.
 * - Google Image extension for key brand images on that page.
 *
 * Run: node tools/build_sitemap.js
 * Invoked from npm run build / build:pages after HTML+i18n.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'sitemap.xml');
const indexOutPath = path.join(root, 'sitemap-index.xml');
const nestedDir = path.join(root, 'sitemap');
const nestedOutPath = path.join(nestedDir, 'sitemap.xml');
const nestedIndexOutPath = path.join(nestedDir, 'sitemap-index.xml');

const BASE = 'https://archopoia.github.io/The-Discording-Tales';
const HOME = `${BASE}/`;

/** @type {{ loc: string; title: string }[]} */
const IMAGES = [
  {
    loc: `${BASE}/assets/og-tdt-1200x630.jpg`,
    title: 'THE DISCORDING TALES - Open Graph preview',
  },
  {
    loc: `${BASE}/assets/images/image/image12.png`,
    title: 'THE DISCORDING TALES - emblem',
  },
  {
    loc: `${BASE}/assets/images/cropped-symbolpur.png`,
    title: 'THE DISCORDING TALES - site icon',
  },
];

function escXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildXml() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const imageBlocks = IMAGES.map(
    (img) => `    <image:image>
      <image:loc>${escXml(img.loc)}</image:loc>
      <image:title>${escXml(img.title)}</image:title>
    </image:image>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${HOME}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${HOME}"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${HOME}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${HOME}"/>
${imageBlocks}
  </url>
</urlset>
`;
}

function buildIndexXml() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const sitemaps = [
    `${BASE}/sitemap.xml`,
    `${BASE}/sitemap/sitemap.xml`,
  ];

  const items = sitemaps
    .map(
      (loc) => `  <sitemap>
    <loc>${escXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}

fs.writeFileSync(outPath, buildXml(), 'utf8');
fs.writeFileSync(indexOutPath, buildIndexXml(), 'utf8');
fs.mkdirSync(nestedDir, { recursive: true });
fs.writeFileSync(nestedOutPath, buildXml(), 'utf8');
fs.writeFileSync(nestedIndexOutPath, buildIndexXml(), 'utf8');
console.log('Wrote sitemap.xml with lastmod', new Date().toISOString().slice(0, 10));
