import { defineConfig } from 'vite';
import path from 'path';

/** WebLLM bootstrap for Play tab — ESM for type="module". Run: vite build --config vite.play-webllm.config.ts */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/play-webllm.ts'),
      output: {
        entryFileNames: 'play-webllm.js',
        chunkFileNames: 'play-webllm-[name].js',
        assetFileNames: 'play-webllm-[name].[ext]',
        format: 'es',
      },
    },
  },
  base: './',
});
