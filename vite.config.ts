import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import devBuildPlugin from './tools/vite-plugin-dev-build.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devBuildPlugin()],
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
