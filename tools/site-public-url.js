/**
 * Public absolute URL prefix (no trailing slash) for canonical links, OG/Twitter,
 * sitemap.xml, robots.txt Sitemap lines, and 404.html.
 *
 * Default matches the production custom domain (GitHub Pages root, no /The-Discording-Tales path).
 * Override for previews or the legacy project URL:
 *   SITE_PUBLIC_URL=https://archopoia.github.io/The-Discording-Tales npm run build
 *
 * GitHub Actions: optional repository variable SITE_PUBLIC_URL overrides this default.
 */
const DEFAULT_BASE = 'https://www.thediscordingtales.com';

export function getSitePublicBase() {
  const raw = (process.env.SITE_PUBLIC_URL || '').trim();
  if (!raw) return DEFAULT_BASE;
  return raw.replace(/\/+$/, '');
}
