/**
 * Generates favicon.ico, PNG icon sizes, and site.webmanifest from the brand symbol.
 * Source: assets/images/cropped-symbolpur.png
 *
 * Run: node tools/build_favicons.js
 * Wired into npm run build via package.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcPath = path.join(root, 'assets', 'images', 'cropped-symbolpur.png');
const iconsDir = path.join(root, 'assets', 'icons');
const faviconIcoPath = path.join(root, 'favicon.ico');
const manifestPath = path.join(root, 'site.webmanifest');

let sharp;
let toIco;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Error: sharp is not installed. Run: npm install');
  process.exit(1);
}
try {
  toIco = (await import('to-ico')).default;
} catch {
  console.error('Error: to-ico is not installed. Run: npm install');
  process.exit(1);
}

/** @type {{ name: string; size: number }[]} */
const PNG_SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

const ICO_SIZES = [16, 32, 48];

async function main() {
  if (!fs.existsSync(srcPath)) {
    console.error('Missing source:', srcPath);
    process.exit(1);
  }

  fs.mkdirSync(iconsDir, { recursive: true });

  const src = sharp(srcPath).ensureAlpha();

  for (const { name, size } of PNG_SIZES) {
    const out = path.join(iconsDir, name);
    await src
      .clone()
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log('Wrote', path.relative(root, out));
  }

  const icoBuffers = await Promise.all(
    ICO_SIZES.map((size) =>
      src
        .clone()
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );
  await fs.promises.writeFile(faviconIcoPath, await toIco(icoBuffers));
  console.log('Wrote', path.relative(root, faviconIcoPath));

  const manifest = {
    name: 'THE DISCORDING TALES',
    short_name: 'TDT',
    description:
      'Weird ethno-science-fantasy tabletop RPG and worldlore - Des Récits Discordants.',
    icons: [
      {
        src: 'assets/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'assets/icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#5a1f1f',
    background_color: '#000000',
    display: 'standalone',
  };
  await fs.promises.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('Wrote', path.relative(root, manifestPath));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
