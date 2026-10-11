import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    build: { target: 'es2015' },
    plugins: [react(), tailwindcss(), VitePWA({ registerType: 'autoUpdate', manifest: { name: 'S.A.R.A AI', short_name: 'S.A.R.A', description: 'Advanced AI Assistant', theme_color: '#000000', icons: [{ src: 'icon.svg', sizes: '192x192', type: 'image/svg+xml' }, { src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml' }] } })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
