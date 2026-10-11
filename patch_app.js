const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
        } else if (action === 'search' || action === 'play_media') {
           const query = detail.extra_data || target;
           const targetApp = target.toLowerCase();
           if (targetApp.includes('youtube') || action === 'play_media') {
              window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(query), '_blank');
           } else if (targetApp.includes('google') || targetApp.includes('chrome')) {
              window.open('https://www.google.com/search?q=' + encodeURIComponent(query), '_blank');
           } else {
              window.open('https://www.google.com/search?q=' + encodeURIComponent(query), '_blank');
           }
        } else if (action === 'click') {
           // Simulate a visual click coordinate display
           try {
             let x = 50, y = 50;
             if (detail.extra_data && detail.extra_data.includes(',')) {
                const parts = detail.extra_data.split(',');
                x = parseInt(parts[0].replace(/[^0-9]/g, '')) || 50;
                y = parseInt(parts[1].replace(/[^0-9]/g, '')) || 50;
                // clamp 0-100
                x = Math.max(0, Math.min(100, x));
                y = Math.max(0, Math.min(100, y));
             }
             const newTap = { id: Date.now(), x, y };
             setTaps(prev => [...prev, newTap]);
             setTimeout(() => {
                setTaps(prev => prev.filter(t => t.id !== newTap.id));
             }, 3000);
           } catch(e) {}
        }`;

code = code.replace(/} else \{\s*window\.open\(\`https:\/\/www\.google\.com\/search\?q=\$\{encodeURIComponent\("Open " \+ target\)\}\`,\s*'_blank'\);\s*\}/, 
`} else {
              window.open(\`https://www.google.com/search?q=\${encodeURIComponent("Open " + target)}\`, '_blank');
           }` + replacement);

fs.writeFileSync('src/App.tsx', code);
