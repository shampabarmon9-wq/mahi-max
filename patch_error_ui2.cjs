const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{showSettings && \(/g;
const replacement = `{error && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-red-500/30 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Permission Error
            </h3>
            <p className="text-white/80 mb-4 whitespace-pre-wrap">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-white/90 transition-colors"
            >
              Refresh App
            </button>
          </div>
        </div>
      )}

      {showSettings && (`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
