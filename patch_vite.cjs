const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

if (!code.includes('VitePWA')) {
  code = "import { VitePWA } from 'vite-plugin-pwa';\n" + code;
  code = code.replace("plugins: [react(), tailwindcss()],", "plugins: [react(), tailwindcss(), VitePWA({ registerType: 'autoUpdate', manifest: { name: 'S.A.R.A AI', short_name: 'S.A.R.A', description: 'Advanced AI Assistant', theme_color: '#000000', icons: [{ src: 'icon.svg', sizes: '192x192', type: 'image/svg+xml' }, { src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml' }] } })],");
  fs.writeFileSync('vite.config.ts', code);
}
