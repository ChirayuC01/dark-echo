import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
    // Inline small assets; keep audio/image assets as files if any are added later
    assetsInlineLimit: 4096,
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
