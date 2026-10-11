const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all window.location.href = X with window.open(X, '_blank', 'noopener,noreferrer')
code = code.replace(/window\.location\.href\s*=\s*(.*?);/g, "window.open($1, '_blank', 'noopener,noreferrer');");

fs.writeFileSync('src/App.tsx', code);
