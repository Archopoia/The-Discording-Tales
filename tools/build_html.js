/**
 * HTML partials build: replace {{peoples-cards}}, {{inspirations-keywords}},
 * {{universe-lore-fr}}, {{zine-content}}, {{about-contact-quest}}, {{about-team}}, {{pitch-deck}} with partials files.
 * Injects {{SITE_PUBLIC_BASE}} from tools/site-public-url.js (SITE_PUBLIC_URL env).
 * Builds 404.html from 404.template.html with the same base.
 *
 * Routing:
 *   /              → cinematic landing (from landing.template.html)
 *   /site/         → interactive hub (from index.template.html + partials)
 *   /landing       → redirect to /
 *
 * Usage:
 *   node tools/build_html.js           -  build pages from templates + partials
 *   node tools/build_html.js --init   -  extract partials from site/index.html and create index.template.html (one-time)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSitePublicBase, getSiteRootHref } from './site-public-url.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const ogMetaPath = path.join(root, 'tools', '.og-assets-meta.json');

/** @returns {{ primary: string; cacheQuery: string; alt: string; orgLogo: string }} */
function loadOgMeta() {
  const fallback = {
    primary: 'assets/og-tdt-1200x630.jpg',
    cacheQuery: '',
    alt: 'THE DISCORDING TALES / DES RÉCITS DISCORDANTS - A weird ethno-science-fantasy Action RPG',
    orgLogo: 'assets/og/tdt-brand-square-512.jpg',
  };
  if (!fs.existsSync(ogMetaPath)) {
    console.warn('Missing tools/.og-assets-meta.json - run: npm run build:og');
    return fallback;
  }
  return { ...fallback, ...JSON.parse(fs.readFileSync(ogMetaPath, 'utf8')) };
}
const partialsDir = path.join(root, 'partials');
const templatePath = path.join(root, 'index.template.html');
const siteIndexPath = path.join(root, 'site', 'index.html');

const PEOPLES_START = 287;   // 1-based, inclusive (<!-- Flip cards...)
const PEOPLES_END = 616;     // closing </div> of peoples-gallery
const KEYWORDS_START = 2241; // <details class="inspirations-expandable"> Keywords
const KEYWORDS_END = 2265;   // </details>

/** Rewrite root-relative asset/page paths so they resolve from /site/. */
function rebaseForSiteSubdir(html) {
  return html.replace(
    /\b(href|src|poster)=(["'])(?!https?:|\/\/|#|mailto:|tel:|data:|\{\{|\/|\.\.\/)([^"']+)\2/gi,
    '$1=$2../$3$2',
  );
}

function applyPublicTokens(html, base, og) {
  const ogImagePath = `${og.primary}${og.cacheQuery}`;
  const orgLogoPath = `${og.orgLogo}${og.cacheQuery}`;
  const rootHref = getSiteRootHref();
  return html
    .replaceAll('{{SITE_PUBLIC_BASE}}', base)
    .replaceAll('{{SITE_ROOT_HREF}}', rootHref)
    .replaceAll('{{OG_IMAGE_PATH}}', ogImagePath)
    .replaceAll('{{OG_IMAGE_ALT}}', og.alt)
    .replaceAll('{{ORG_LOGO_PATH}}', orgLogoPath);
}

function landingSpaBounceScript() {
  // Legacy deep links to the interactive hub used to live at `/#…` and `/?lang=fr`.
  // Bounce those to /site/ without stealing landing-native anchors (hero, world, team, pitch…).
  return `<script>
(function () {
  var q = location.search || '';
  if (/[?&]lang=fr\\b/i.test(q)) {
    location.replace('site/' + q + (location.hash || ''));
    return;
  }
  var h = (location.hash || '').replace(/^#/, '').split('?')[0].split('&')[0];
  if (!h) return;
  var keep = { top:1, hero:1, scene:1, world:1, team:1, pitch:1, 'world-title':1, 'dungeon-title':1, 'team-title':1, 'pitch-title':1, 'hero-title':1 };
  if (keep[h]) return;
  location.replace('site/' + location.hash + q);
})();
</script>`;
}

function buildLandingRedirect(base) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>THE DISCORDING TALES</title>
  <link rel="canonical" href="${base}/"/>
  <meta http-equiv="refresh" content="0;url=${base}/"/>
  <script>location.replace(${JSON.stringify(base + '/')} + location.search + location.hash);</script>
</head>
<body>
  <p><a href="${base}/">Continue to THE DISCORDING TALES</a></p>
</body>
</html>
`;
}

function build() {
  const template = fs.readFileSync(templatePath, 'utf8');
  const peoplesPath = path.join(partialsDir, 'peoples-cards.html');
  const keywordsPath = path.join(partialsDir, 'inspirations-keywords.html');
  const zinePath = path.join(partialsDir, 'zine-content.html');
  const universeLorePath = path.join(partialsDir, 'universe-lore-fr.html');
  const aboutQuestPath = path.join(partialsDir, 'about-contact-quest.html');
  const aboutTeamPath = path.join(partialsDir, 'about-team.html');
  const pitchDeckPath = path.join(partialsDir, 'pitch-deck.html');
  const peoples = fs.readFileSync(peoplesPath, 'utf8');
  const keywords = fs.readFileSync(keywordsPath, 'utf8');
  const zineContent = fs.existsSync(zinePath) ? fs.readFileSync(zinePath, 'utf8') : '<!-- Run build_zine.js to generate zine-content -->';
  const universeLoreFr = fs.existsSync(universeLorePath)
    ? fs.readFileSync(universeLorePath, 'utf8')
    : '<!-- missing partials/universe-lore-fr.html -->';
  const aboutContactQuest = fs.existsSync(aboutQuestPath)
    ? fs.readFileSync(aboutQuestPath, 'utf8')
    : '<!-- missing partials/about-contact-quest.html -->';
  const aboutTeam = fs.existsSync(aboutTeamPath)
    ? fs.readFileSync(aboutTeamPath, 'utf8')
    : '<!-- missing partials/about-team.html -->';
  const pitchDeck = fs.existsSync(pitchDeckPath)
    ? fs.readFileSync(pitchDeckPath, 'utf8')
    : '<!-- missing partials/pitch-deck.html -->';
  let out = template
    .replace('{{peoples-cards}}', peoples.trim())
    .replace('{{inspirations-keywords}}', keywords.trim())
    .replace('{{universe-lore-fr}}', universeLoreFr.trim())
    .replace('{{zine-content}}', zineContent.trim())
    .replace('{{about-contact-quest}}', aboutContactQuest.trim())
    .replace('{{about-team}}', aboutTeam.trim())
    .replace('{{pitch-deck}}', pitchDeck.trim());
  const base = getSitePublicBase();
  const og = loadOgMeta();
  out = applyPublicTokens(out, base, og);
  out = rebaseForSiteSubdir(out);
  fs.mkdirSync(path.dirname(siteIndexPath), { recursive: true });
  fs.writeFileSync(siteIndexPath, out, 'utf8');
  console.log('Built site/index.html from template + partials');

  const fourTemplatePath = path.join(root, '404.template.html');
  const fourOutPath = path.join(root, '404.html');
  if (fs.existsSync(fourTemplatePath)) {
    const four = applyPublicTokens(fs.readFileSync(fourTemplatePath, 'utf8'), base, og);
    fs.writeFileSync(fourOutPath, four, 'utf8');
    console.log('Built 404.html from 404.template.html');
  }

  const legalPages = [
    ['privacy.template.html', path.join('privacy', 'index.html')],
    ['impressum.template.html', path.join('impressum', 'index.html')],
    ['scene-lab.template.html', path.join('scene-lab', 'index.html')],
  ];
  for (const [templateName, outRel] of legalPages) {
    const legalTemplatePath = path.join(root, templateName);
    if (!fs.existsSync(legalTemplatePath)) continue;
    const html = applyPublicTokens(fs.readFileSync(legalTemplatePath, 'utf8'), base, og);
    const legalOutPath = path.join(root, outRel);
    fs.mkdirSync(path.dirname(legalOutPath), { recursive: true });
    fs.writeFileSync(legalOutPath, html, 'utf8');
    console.log('Built', outRel, 'from', templateName);
  }

  // Cinematic landing owns `/`
  const landingTemplatePath = path.join(root, 'landing.template.html');
  if (fs.existsSync(landingTemplatePath)) {
    let landing = fs.readFileSync(landingTemplatePath, 'utf8');
    // Template still uses ../ for historical /landing/ paths; flatten for root.
    landing = landing.replaceAll('../', '');
    landing = applyPublicTokens(landing, base, og);
    if (!landing.includes('tdt-spa-bounce')) {
      landing = landing.replace(/<head>/i, `<head>\n    <!-- tdt-spa-bounce -->\n    ${landingSpaBounceScript()}`);
    }
    fs.writeFileSync(path.join(root, 'index.html'), landing, 'utf8');
    console.log('Built index.html from landing.template.html (homepage)');

    const landingDir = path.join(root, 'landing');
    fs.mkdirSync(landingDir, { recursive: true });
    fs.writeFileSync(path.join(landingDir, 'index.html'), buildLandingRedirect(base), 'utf8');
    console.log('Built landing/index.html redirect → /');
  }
}

function init() {
  const index = fs.readFileSync(siteIndexPath, 'utf8');
  const lines = index.split('\n');
  if (!fs.existsSync(partialsDir)) {
    fs.mkdirSync(partialsDir, { recursive: true });
  }
  const peoplesBlock = lines.slice(PEOPLES_START - 1, PEOPLES_END).join('\n');
  const keywordsBlock = lines.slice(KEYWORDS_START - 1, KEYWORDS_END).join('\n');
  fs.writeFileSync(path.join(partialsDir, 'peoples-cards.html'), peoplesBlock.trimEnd() + '\n', 'utf8');
  fs.writeFileSync(path.join(partialsDir, 'inspirations-keywords.html'), keywordsBlock.trimEnd() + '\n', 'utf8');
  const beforePeoples = lines.slice(0, PEOPLES_START - 1).join('\n');
  const betweenBlocks = lines.slice(PEOPLES_END, KEYWORDS_START - 1).join('\n');
  const afterKeywords = lines.slice(KEYWORDS_END).join('\n');
  const templateContent = beforePeoples + '\n{{peoples-cards}}\n\n' + betweenBlocks + '\n{{inspirations-keywords}}\n\n' + afterKeywords;
  fs.writeFileSync(templatePath, templateContent, 'utf8');
  console.log('Created index.template.html and partials/peoples-cards.html, partials/inspirations-keywords.html');
  build();
}

const isInit = process.argv.includes('--init');
if (isInit) {
  init();
} else {
  build();
}
