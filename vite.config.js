import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
    // Inline small assets; keep audio/image assets as files if any are added later
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        // Game at site root (also the Capacitor/Android entry — do not move off root)
        main: resolve(__dirname, 'index.html'),
        // Marketing landing page, served at /landing/
        landing: resolve(__dirname, 'landing/index.html'),
      },
    },
  },
  server: {
    port: 8080,
    // Open browser automatically on dev start
    open: false,
  },
  preview: {
    port: 8080,
  },
});
