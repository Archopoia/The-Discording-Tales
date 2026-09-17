/**
 * Build dist/main-site.js (site chrome + gm-chat bundle).
 * Run: node tools/build_main_site.js
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const child = spawn(
  'npx',
  ['vite', 'build', '--config', 'vite.main-site.config.ts'],
  { cwd: root, stdio: 'inherit', shell: true }
);

child.on('close', (code) => {
  process.exit(code ?? 1);
});
