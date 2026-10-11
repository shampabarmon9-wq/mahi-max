const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex1 = /localStorage\.getItem\("allAccessGranted"\)/g;
const replacement1 = `(function(){ try { return localStorage.getItem("allAccessGranted"); } catch(e) { return null; } })()`;
code = code.replace(regex1, replacement1);

const regex2 = /localStorage\.setItem\("allAccessGranted", "true"\);/g;
const replacement2 = `try { localStorage.setItem("allAccessGranted", "true"); } catch(e) {}`;
code = code.replace(regex2, replacement2);

fs.writeFileSync('src/App.tsx', code);
