const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We need to replace the content of the error modal.
const regex = /<h3 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2">[\s\S]*?Refresh App[\s\S]*?<\/button>/g;

const replacement = `<h3 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Mic Permission Blocked
            </h3>
            <p className="text-white/80 mb-4 whitespace-pre-wrap">{error}</p>
            <div className="bg-red-500/10 p-4 rounded-xl mb-6">
              <p className="text-sm text-red-200 mb-2">
                <strong>Why this happens in APKs:</strong> Free Website-to-APK makers don't add Android Microphone Permission code, so Android OS blocks it permanently.
              </p>
              <p className="text-sm text-red-200">
                <strong>How to fix:</strong> Close this app, open the link in Chrome browser, and tap "Install App" or "Add to Home Screen".
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
              >
                Close & Retry
              </button>
              {deferredPrompt && (
                <button 
                  onClick={handleInstallApp}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
                >
                  Install App
                </button>
              )}
            </div>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
