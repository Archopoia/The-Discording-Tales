/**
 * Derives share / SEO image sizes from assets/og-tdt-1200x630.jpg (edit that file by hand).
 * Writes assets/og/* variants and tools/.og-assets-meta.json for HTML injection.
 *
 * Run: node tools/build_og_assets.js
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const masterPath = path.join(root, 'assets', 'og-tdt-1200x630.jpg');
const ogDir = path.join(root, 'assets', 'og');
const metaPath = path.join(root, 'tools', '.og-assets-meta.json');

const OG_W = 1200;
const OG_H = 630;

/** @type {{ file: string; w: number; h: number; cropSquare?: boolean }[]} */
const DERIVATIVES = [
  { file: 'og-tdt-600x315.jpg', w: 600, h: 315 },
  { file: 'og-tdt-400x210.jpg', w: 400, h: 210 },
  { file: 'tdt-brand-square-600.jpg', w: 600, h: 600, cropSquare: true },
  { file: 'tdt-brand-square-512.jpg', w: 512, h: 512, cropSquare: true },
];

const OG_IMAGE_ALT =
  'THE DISCORDING TALES / DES RÉCITS DISCORDANTS - An ethno-science-fantasy gameworld';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Error: sharp is not installed. Run: npm install');
  process.exit(1);
}

function fileHash(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex').slice(0, 8);
}

async function writeMasterJpeg(pipeline) {
  const tmpPath = `${masterPath}.tmp.jpg`;
  await pipeline
    .clone()
    .resize(OG_W, OG_H, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(tmpPath);
  await fs.promises.rename(tmpPath, masterPath);
}

async function main() {
  if (!fs.existsSync(masterPath)) {
    console.error('Missing master Open Graph image:', masterPath);
    process.exit(1);
  }

  fs.mkdirSync(ogDir, { recursive: true });

  const meta = await sharp(masterPath).metadata();
  const normalized = sharp(masterPath).rotate();

  if (meta.width !== OG_W || meta.height !== OG_H) {
    console.log(`Normalizing master ${meta.width}x${meta.height} -> ${OG_W}x${OG_H}`);
  }
  await writeMasterJpeg(normalized);

  const master = sharp(masterPath);
  const squareSize = OG_H;
  const squareLeft = Math.max(0, Math.floor((OG_W - squareSize) / 2));

  for (const { file, w, h, cropSquare } of DERIVATIVES) {
    const out = path.join(ogDir, file);
    let pipe = master.clone();
    if (cropSquare) {
      pipe = pipe.extract({
        left: squareLeft,
        top: 0,
        width: squareSize,
        height: squareSize,
      });
    }
    await pipe
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(out);
    console.log('Wrote', path.relative(root, out));
  }

  const cacheQuery = `?v=${fileHash(masterPath)}`;
  const ogMeta = {
    primary: 'assets/og-tdt-1200x630.jpg',
    cacheQuery,
    alt: OG_IMAGE_ALT,
    width: OG_W,
    height: OG_H,
    orgLogo: 'assets/og/tdt-brand-square-512.jpg',
    brandSquare: 'assets/og/tdt-brand-square-600.jpg',
  };
  await fs.promises.writeFile(metaPath, `${JSON.stringify(ogMeta, null, 2)}\n`);
  console.log('Wrote', path.relative(root, metaPath), cacheQuery);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
