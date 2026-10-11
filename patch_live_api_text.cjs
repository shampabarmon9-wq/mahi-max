const fs = require('fs');
let code = fs.readFileSync('src/lib/useLiveAPI.ts', 'utf8');

const regex = /throw new Error\("Microphone Error \(\$\{err\.name\}: \$\{err\.message\}\)\.\\n\\n1\. If using an APK converter[^]*?"\);/g;

const replacement = `throw new Error(\`Microphone Error: \${err.name} - \${err.message}\\n\\nTo fix this: Please open the app in a normal web browser (like Chrome). If you generated this APK using a random website, it is missing native Android permissions.\`);`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/lib/useLiveAPI.ts', code);
