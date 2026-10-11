const fs = require('fs');
let code = fs.readFileSync('src/lib/useLiveAPI.ts', 'utf8');

const regex = /throw new Error\("Microphone permission denied or not available\.\[\\s\\S\]*?"\);/g;
const replacement = `throw new Error("Microphone permission denied or not available.\\n\\nIf you used a Website-to-APK tool, DELETE the APK. Those tools block microphones.\\n\\nInstead, open the link in Chrome and tap 'Add to Home Screen' to install the real app.\\n\\nIf in browser: Allow mic access in URL bar.");`;

code = code.replace(/throw new Error\("Microphone permission denied or not available\.[^]*?"\);/g, replacement);

fs.writeFileSync('src/lib/useLiveAPI.ts', code);
