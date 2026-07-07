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
        // Marketing landing page at site root (/). Also the Capacitor/Android
        // entry — its inline script redirects the native shell to play/.
        main: resolve(__dirname, 'index.html'),
        // The game, served at /play/.
        game: resolve(__dirname, 'play/index.html'),
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
