import { defineConfig } from 'vite';
import path from 'path';

/**
 * Vite config for the /landing/ cinematic bundle.
 * Owns its own gsap.ticker + Lenis + Three.js; isolated from main-site.js and shaders.js.
 * Run: vite build --config vite.landing.config.ts
 * Output: dist/landing.js (IIFE) + dist/landing.css
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/landing/main.ts'),
      output: {
        entryFileNames: 'landing.js',
        assetFileNames: (asset) => {
          if (asset.name && asset.name.endsWith('.css')) return 'landing.css';
          return 'landing-[name][extname]';
        },
        format: 'iife',
        name: 'TDTLanding',
      },
    },
  },
  base: './',
});
