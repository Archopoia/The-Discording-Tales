/**
 * Public absolute URL prefix (no trailing slash) for canonical links, OG/Twitter,
 * sitemap.xml, robots.txt Sitemap lines, and 404.html.
 *
 * Override at build time when the site is served from a custom domain or path:
 *   SITE_PUBLIC_URL=https://www.example.com/The-Discording-Tales npm run build
 *
 * GitHub Actions: set repository variable SITE_PUBLIC_URL (optional).
 */
const DEFAULT_BASE = 'https://archopoia.github.io/The-Discording-Tales';

export function getSitePublicBase() {
  const raw = (process.env.SITE_PUBLIC_URL || '').trim();
  if (!raw) return DEFAULT_BASE;
  return raw.replace(/\/+$/, '');
}
