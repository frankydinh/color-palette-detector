import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      // The side panel HTML is the primary entry; CRXJS wires up the rest
      // (service worker, content scripts, workers) from the manifest.
      input: {
        sidepanel: 'src/sidepanel/index.html',
      },
    },
  },
  // Required so the @crxjs HMR websocket works reliably in the extension.
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  worker: {
    format: 'es',
  },
});
