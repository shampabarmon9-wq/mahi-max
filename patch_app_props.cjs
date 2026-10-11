const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /function DashboardModal\(\{\s*onClose,\s*onAllow,\s*voice,\s*setVoice,\s*apiLimit\s*\}\:\s*\{\s*onClose\:\s*\(\)\s*\=\>\s*void,\s*onAllow\:\s*\(\)\s*\=\>\s*void,\s*voice\:\s*string,\s*setVoice\:\s*\(v\:\s*string\)\s*\=\>\s*void,\s*apiLimit\:\s*number\s*\}\)/g,
  `function DashboardModal({ 
  onClose, 
  onAllow,
  voice,
  setVoice,
  apiLimit,
  deferredPrompt,
  handleInstallApp
}: { 
  onClose: () => void, 
  onAllow: () => void,
  voice: string,
  setVoice: (v: string) => void,
  apiLimit: number,
  deferredPrompt?: any,
  handleInstallApp?: () => void
})`
);

code = code.replace(
  /<DashboardModal\s*onClose=\{\(\) \=\> setShowSettings\(false\)\}\s*onAllow=\{\(\) \=\> \{ handleAllowPermissions\(\); if \(\!connected\) handleConnect\(\); \}\}\s*voice=\{voice\}\s*setVoice=\{setVoice\}\s*apiLimit=\{apiLimit\}\s*\/>/g,
  `<DashboardModal 
           onClose={() => setShowSettings(false)} 
           onAllow={() => { handleAllowPermissions(); if (!connected) handleConnect(); }} 
           voice={voice}
           setVoice={setVoice}
           apiLimit={apiLimit}
           deferredPrompt={deferredPrompt}
           handleInstallApp={handleInstallApp}
        />`
);

fs.writeFileSync('src/App.tsx', code);
