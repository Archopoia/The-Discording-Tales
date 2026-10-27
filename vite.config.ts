import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import devBuildPlugin from './tools/vite-plugin-dev-build.js';

/**
 * Vite transforms any .js under the project root. Our prebuilt IIFEs in /dist/
 * (landing.js, main-site.js, …) must be served raw - otherwise Vite re-bundles
 * them into ~900KB modules and the landing curtain feels stuck for seconds.
 */
function servePrebuiltDist(): Plugin {
  const raw = new Set([
    '/dist/landing.js',
    '/dist/landing.css',
    '/dist/main-site.js',
    '/dist/main-site.css',
    '/dist/character-sheet.js',
  ]);
  const mime: Record<string, string> = {
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
  };
  return {
    name: 'serve-prebuilt-dist',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        const pathname = url.split('?')[0];
        if (!raw.has(pathname)) {
          next();
          return;
        }
        const filePath = path.join(server.config.root, pathname.slice(1));
        if (!fs.existsSync(filePath)) {
          next();
          return;
        }
        const ext = path.extname(filePath);
        res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [servePrebuiltDist(), react(), devBuildPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't empty dist to preserve other files
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.tsx'),
      output: {
        entryFileNames: 'character-sheet.js',
        chunkFileNames: 'character-sheet-[name].js',
        assetFileNames: 'character-sheet-[name].[ext]',
        format: 'iife',
        name: 'CharacterSheet',
      },
    },
  },
  base: './',
});
