const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /window\.location\.href = pendingUrl;/g,
  `window.open(pendingUrl, '_blank', 'noopener,noreferrer');`
);

fs.writeFileSync('src/App.tsx', code);
