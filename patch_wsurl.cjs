const fs = require('fs');
let code = fs.readFileSync('src/lib/useLiveAPI.ts', 'utf8');

const regex = /const wsUrl = `\$\{protocol\}\/\/\$\{window\.location\.host\}\/live\?key=\$\{encodeURIComponent\(keyToUse\)\}&voice=\$\{encodeURIComponent\(selectedVoice\)\}`;/g;
const replacement = `const host = window.location.host || 'ais-pre-x6spyydwnmq6yqoi2n7ypk-12104514292.asia-southeast1.run.app';
      const safeProtocol = window.location.protocol === 'http:' ? 'ws:' : 'wss:';
      const wsUrl = \`\${safeProtocol}//\${host}/live?key=\${encodeURIComponent(keyToUse)}&voice=\${encodeURIComponent(selectedVoice)}\`;`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/useLiveAPI.ts', code);
