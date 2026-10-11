const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add deferredPrompt state
const regexState = /const \[showSettings, setShowSettings\] = useState\(false\);/;
const replacementState = `const [showSettings, setShowSettings] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);
  
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };`;
code = code.replace(regexState, replacementState);

// Replace the error modal content
const regexError = /<p className="text-white\/80 mb-4 whitespace-pre-wrap">\{error\}<\/p>[\s\S]*?<button/g;
const replacementError = `<p className="text-white/80 mb-4 whitespace-pre-wrap">{error}</p>
            <div className="bg-red-500/10 p-4 rounded-xl mb-6">
              <p className="text-sm text-red-200">
                <strong>DO NOT USE APK CONVERTERS!</strong><br/>
                3rd-party Website-to-APK tools permanently block microphones. Delete that APK.
              </p>
              {deferredPrompt ? (
                <button 
                  onClick={handleInstallApp}
                  className="mt-4 w-full bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Install Official App (Fixes Mic)
                </button>
              ) : (
                <p className="mt-3 text-sm text-blue-300">
                  Open this link in <strong>Chrome</strong> and tap "Add to Home Screen" to install it as a real Native App with working mic!
                </p>
              )}
            </div>
            <button`;
code = code.replace(regexError, replacementError);

// Add an Install App button in the settings modal as well
const regexSettingsHeader = /<h2 className="text-2xl font-black text-white flex items-center gap-3">[\s\S]*?Assistant Settings[\s\S]*?<\/h2>/g;
const replacementSettingsHeader = `<h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-[#00f0ff]" /> 
            Assistant Settings
          </h2>
          {deferredPrompt && (
            <button onClick={handleInstallApp} className="ml-auto mr-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
              Install App
            </button>
          )}`;
code = code.replace(regexSettingsHeader, replacementSettingsHeader);

fs.writeFileSync('src/App.tsx', code);
