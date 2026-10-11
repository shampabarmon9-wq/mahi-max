const fs = require('fs');
let code = fs.readFileSync('src/lib/useLiveAPI.ts', 'utf8');

const regex = /catch \(err\) \{\s*throw new Error\("Microphone permission denied or not available[^]*?"\);\s*\}/;
const replacement = `catch (err: any) {
           throw new Error(\`Microphone Error (\${err.name}: \${err.message}).\\n\\n1. If using an APK converter, microphones are blocked by those apps. Use Chrome and 'Add to Home Screen' instead.\\n2. If in a browser, click the lock icon in the URL bar and ALLOW microphone.\\n3. If in AI Studio, click 'Open App in New Tab' (top right).\`);
        }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/useLiveAPI.ts', code);
