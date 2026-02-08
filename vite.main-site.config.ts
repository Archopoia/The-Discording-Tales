import { defineConfig } from 'vite';
import path from 'path';

/**
 * Vite config for main-site bundle only (shaders, dtd-interactive, gm-system-prompt, gm-chat).
 * Run: vite build --config vite.main-site.config.ts
 * Output: dist/main-site.js (IIFE, no framework).
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main-site.ts'),
      output: {
        entryFileNames: 'main-site.js',
        format: 'iife',
        name: 'MainSite',
      },
    },
  },
  base: './',
});
