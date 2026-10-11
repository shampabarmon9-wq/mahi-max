const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/window\.open\('intent:\/\/#Intent, '_blank', 'noopener,noreferrer'\);action=(.*?);end';/g, "window.open('intent://#Intent;action=$1;end', '_blank', 'noopener,noreferrer');");

fs.writeFileSync('src/App.tsx', code);
