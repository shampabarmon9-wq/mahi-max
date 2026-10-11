import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useLiveAPI } from './lib/useLiveAPI';
import { useWakeWord } from './lib/useWakeWord';
import { soundEffects } from './lib/soundEffects';
import { accessibilityService } from './lib/accessibilityService';
import { GeminiEdgeGlow } from './components/GeminiEdgeGlow';
import { FaceVerificationModal } from './components/FaceVerificationModal';
import { YouTubeController } from './components/YouTubeController';
import { WhatsAppConfirmModal } from './components/WhatsAppConfirmModal';
import { SettingsModal } from './components/SettingsModal';
import { SMSModal } from './components/SMSModal';
import { PhoneCallModal } from './components/PhoneCallModal';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Avatar } from './components/Avatar';
import {
  Settings,
  ShieldCheck,
  Phone,
  MessageSquare,
  Siren,
  Bell,
  Mic,
  MicOff,
  Volume2,
  Radio,
  ExternalLink,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const THEMES = ['#00f0ff', '#ff00ff', '#00ff00', '#ff2255', '#ffaa00'];

export default function App() {
  const {
    connected,
    isConnecting,
    isSpeaking,
    error,
    pendingUrl,
    setPendingUrl,
    connect,
    disconnect,
    analyser,
    inputAnalyser,
  } = useLiveAPI();

  const [showSettings, setShowSettings] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [smsModalProps, setSmsModalProps] = useState<{
    recipient?: string;
    message?: string;
    isReply?: boolean;
  }>({});

  const [isFaceVerified, setIsFaceVerified] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mahi_face_profile');
      return !!(saved && JSON.parse(saved).verified);
    } catch (e) {
      return false;
    }
  });

  // Wake word is strictly disabled by default so the microphone only opens when user taps the mic button
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(false);
  const [voice, setVoice] = useState('female_1');
  const [agentStatus, setAgentStatus] = useState("Tap mic to start");
  const [apiLimit, setApiLimit] = useState(100);

  // Incoming Call/SMS/Intruder Alert Banner
  const [activeAlert, setActiveAlert] = useState<{
    type: 'call' | 'sms' | 'intruder';
    title: string;
    description: string;
    sender?: string;
    content?: string;
  } | null>(null);

  // YouTube Controller state
  const [youtubeState, setYoutubeState] = useState<{ active: boolean; query: string } | null>(null);

  // WhatsApp Draft state
  const [whatsappDraft, setWhatsappDraft] = useState<{ recipient: string; message: string } | null>(null);

  // Widget Theme State
  const [themeIndex, setThemeIndex] = useState(0);
  const activeTheme = THEMES[themeIndex];

  // User input volume calculation for Edge Glow and Equalizer
  const [userVolume, setUserVolume] = useState(0);

  useEffect(() => {
    if (!connected || !inputAnalyser) {
      setUserVolume(0);
      return;
    }
    const dataArray = new Uint8Array(inputAnalyser.frequencyBinCount);
    let requestRef: number;
    const updateVolume = () => {
      inputAnalyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      setUserVolume(Math.min(avg / 40, 1.0));
      requestRef = requestAnimationFrame(updateVolume);
    };
    requestRef = requestAnimationFrame(updateVolume);
    return () => cancelAnimationFrame(requestRef);
  }, [connected, inputAnalyser]);

  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('mahi_user_name') || '';
    } catch (e) {
      return '';
    }
  });

  const [missingKeyPrompt, setMissingKeyPrompt] = useState(false);

  // Connect helper - requires valid API key
  const handleConnect = useCallback((explicitKey?: string) => {
    const stored = localStorage.getItem('mahi_api_key') || '';
    const key = (explicitKey && explicitKey.trim()) || stored.trim();

    if (!key) {
      setMissingKeyPrompt(true);
      setShowSettings(true);
      const name = localStorage.getItem('mahi_user_name') || '';
      const salutation = name ? `${name} Sir` : "Sir";
      speakAloud(`Please enter your Google AI Studio API key in Settings first, ${salutation}.`, 'en-US');
      setTimeout(() => setMissingKeyPrompt(false), 5000);
      return;
    }

    setMissingKeyPrompt(false);
    connect(key, voice);
    soundEffects.playWakeUp();

    const currentName = localStorage.getItem('mahi_user_name') || userName || '';
    const salutationHindi = currentName ? `${currentName} सर` : "सर";
    speakAloud(`हाँ ${salutationHindi}, बोलिए मैं आपकी क्या सहायता करूँ?`, 'hi-IN');
  }, [connect, voice, userName]);

  // Speak announcement aloud with speech synthesis
  const speakAloud = useCallback((text: string, lang = 'hi-IN', onDone?: () => void) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang;
        utter.rate = 1.0;
        utter.pitch = 1.1;
        if (onDone) {
          utter.onend = onDone;
          utter.onerror = onDone;
        }
        window.speechSynthesis.speak(utter);
      } catch (e) {
        if (onDone) onDone();
      }
    } else {
      if (onDone) onDone();
    }
  }, []);

  // Intruder Alert trigger
  const triggerIntruderAlert = useCallback((reason = "Unauthorized phone touch detected") => {
    soundEffects.playIntruderAlert();
    setActiveAlert({
      type: 'intruder',
      title: '🚨 SECURITY ALERT: PHONE TOUCHED!',
      description: 'सर, किसी अज्ञात व्यक्ति ने आपका फोन छुआ है! उसका चेहरा मैच नहीं हुआ।'
    });

    const langPref = localStorage.getItem('mahi_language') || 'auto';
    const alertSpeech = langPref === 'bn'
      ? "স্যার, একজন অপরিচিত ব্যক্তি আপনার ফোন স্পর্শ করেছে! তার মুখ আপনার ফেস ডেটার সাথে মেলেনি।"
      : langPref === 'en'
      ? "Sir, someone touched your phone! Their face did not match your registered biometric profile."
      : "सर, किसी अज्ञात व्यक्ति ने आपके फोन को छुआ है! उसका चेहरा आपके फेस डेटा से मैच नहीं हुआ, इसलिए मैंने अलर्ट जारी कर दिया है।";

    speakAloud(alertSpeech, langPref === 'bn' ? 'bn-IN' : langPref === 'en' ? 'en-US' : 'hi-IN');
    setTimeout(() => {
      setActiveAlert(null);
    }, 9000);
  }, [speakAloud]);

  // Incoming Call Handler
  const handleIncomingCall = useCallback((callerName: string) => {
    setActiveAlert({
      type: 'call',
      title: `📞 Incoming Call: ${callerName}`,
      description: `सर, आपको ${callerName} ने कॉल किया है।`,
      sender: callerName,
    });

    const langPref = localStorage.getItem('mahi_language') || 'auto';
    const text = langPref === 'bn'
      ? `স্যার, ${callerName} আপনাকে কল করেছে।`
      : langPref === 'en'
      ? `Sir, you have an incoming call from ${callerName}.`
      : `सर, आपको ${callerName} ने कॉल किया है।`;

    speakAloud(text, langPref === 'bn' ? 'bn-IN' : langPref === 'en' ? 'en-US' : 'hi-IN');
    setTimeout(() => {
      setActiveAlert(null);
    }, 7000);
  }, [speakAloud]);

  // Incoming SMS Handler
  const handleIncomingSMS = useCallback((sender: string, message: string) => {
    setActiveAlert({
      type: 'sms',
      title: `💬 New SMS from ${sender}`,
      description: message,
      sender: sender,
      content: message,
    });

    const langPref = localStorage.getItem('mahi_language') || 'auto';
    const text = langPref === 'bn'
      ? `স্যার, ${sender} আপনাকে এসএমএস পাঠিয়েছে।`
      : langPref === 'en'
      ? `Sir, you received a message from ${sender}.`
      : `सर, आपको ${sender} ने एसएमएस भेजा है।`;

    speakAloud(text, langPref === 'bn' ? 'bn-IN' : langPref === 'en' ? 'en-US' : 'hi-IN');
    setTimeout(() => {
      setActiveAlert(null);
    }, 8000);
  }, [speakAloud]);

  // Always-Ready Wake Word: Seamless background listening without audio loop
  const { isListeningForWakeWord } = useWakeWord({
    enabled: wakeWordEnabled && !connected,
    isAssistantSpeaking: isSpeaking,
    onWakeWord: (detectedPhrase) => {
      soundEffects.playWakeUp();

      const currentName = localStorage.getItem('mahi_user_name') || userName || '';
      const salutationHindi = currentName ? `${currentName} सर` : "सर";
      const salutationEnglish = currentName ? `${currentName} Sir` : "Sir";
      const isBengali = /মাহি|হে/.test(detectedPhrase) || localStorage.getItem('mahi_language') === 'bn';
      const isEnglish = localStorage.getItem('mahi_language') === 'en';
      const greeting = isBengali
        ? `হ্যাঁ ${salutationEnglish}, বলুন।`
        : isEnglish
        ? `Yes ${salutationEnglish}, how can I help you?`
        : `हाँ ${salutationHindi}, क्या काम है बोलो।`;
      const lang = isBengali ? 'bn-IN' : isEnglish ? 'en-US' : 'hi-IN';

      // Speak greeting and only connect AFTER speaking finishes to prevent self-hearing feedback
      speakAloud(greeting, lang, () => {
        handleConnect();
      });
    },
    lang: 'hi-IN',
  });

  // Execute native app and Android intents via Accessibility Service
  const executeAppAction = useCallback((actionStr: string, targetStr: string, extraData?: string) => {
    const action = (actionStr || '').toLowerCase();
    const target = targetStr || '';
    const cleanNum = target.replace(/[^0-9+]/g, '');

    if (action === 'make_call' || action === 'voice_call' || action === 'open_dialer') {
      accessibilityService.makeCallIntent(cleanNum || target);
    } else if (action === 'send_sms') {
      accessibilityService.sendSMSIntent(cleanNum || target, extraData || '');
    } else if (action === 'open_settings') {
      accessibilityService.openSystemAccessibilitySettings();
    } else if (action === 'scroll_up') {
      accessibilityService.scroll('up');
    } else if (action === 'scroll_down') {
      accessibilityService.scroll('down');
    } else if (action === 'go_back') {
      accessibilityService.navigateBack();
    } else if (action === 'click_element') {
      accessibilityService.clickElementByText(target);
    } else if (action === 'search' || action === 'play_media' || action === 'play') {
      const query = extraData || target;
      setYoutubeState({ active: true, query });
      accessibilityService.launchApp('youtube');
    } else if (action === 'open' || action === 'open_app') {
      accessibilityService.launchApp(target);
    }
  }, []);

  // Event Listeners for Live Gemini Server Tool calls
  useEffect(() => {
    const handleDeviceControl = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        executeAppAction(detail.action || '', detail.target || '', detail.extra_data);
      }
    };

    const handleSendSMS = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setSmsModalProps({
          recipient: detail.recipient || '',
          message: detail.message || '',
          isReply: false,
        });
        setShowSMSModal(true);
        if (detail.recipient) {
          accessibilityService.sendSMSIntent(detail.recipient, detail.message || '');
        }
      }
    };

    const handleReplySMS = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setSmsModalProps({
          recipient: activeAlert?.sender || '',
          message: detail.message || '',
          isReply: true,
        });
        setShowSMSModal(true);
        if (activeAlert?.sender) {
          accessibilityService.sendSMSIntent(activeAlert.sender, detail.message || '');
        }
      }
    };

    const handleCallControl = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        const targetNum = detail.target || detail.digits || '';
        accessibilityService.makeCallIntent(targetNum);
      }
    };

    const handleManageApps = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        accessibilityService.launchApp(detail.appName || '');
      }
    };

    const handleInspectScreen = () => {
      const screenInfo = accessibilityService.inspectVisibleScreen();
      const currentName = localStorage.getItem('mahi_user_name') || userName || '';
      const salutationHindi = currentName ? `${currentName} सर` : "सर";
      speakAloud(`${salutationHindi}, स्क्रीन पर ${screenInfo.elements.slice(0, 3).join(', ') || 'कंट्रोल्स'} दिखाई दे रहे हैं।`, 'hi-IN');
    };

    const handleClickScreenElement = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.query) {
        accessibilityService.clickElementByText(detail.query);
      }
    };

    const handleScrollScreen = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.direction) {
        accessibilityService.scroll(detail.direction);
      }
    };

    const handleYouTubeControl = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setYoutubeState({ active: true, query: detail.query || 'Trending' });
      }
    };

    const handleWhatsAppDraft = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setWhatsappDraft({
          recipient: detail.recipient || '',
          message: detail.message || '',
        });
      }
    };

    const handleWhatsAppConfirm = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.confirmed && whatsappDraft) {
        const cleanNum = whatsappDraft.recipient.replace(/[^0-9+]/g, '');
        const msg = encodeURIComponent(whatsappDraft.message);
        if (cleanNum) {
          window.location.href = `https://api.whatsapp.com/send?phone=${cleanNum}&text=${msg}`;
        } else {
          window.location.href = 'whatsapp://';
        }
      }
      setWhatsappDraft(null);
    };

    const handleSimulatePhoneEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        if (detail.type === 'call') {
          handleIncomingCall(detail.sender || 'Unknown Caller');
        } else if (detail.type === 'sms') {
          handleIncomingSMS(detail.sender || 'Unknown Sender', detail.content || 'Hello!');
        } else if (detail.type === 'intruder_alert') {
          triggerIntruderAlert(detail.reason);
        }
      }
    };

    window.addEventListener('device_control', handleDeviceControl);
    window.addEventListener('send_sms', handleSendSMS);
    window.addEventListener('reply_sms', handleReplySMS);
    window.addEventListener('call_control', handleCallControl);
    window.addEventListener('manage_apps', handleManageApps);
    window.addEventListener('inspect_screen', handleInspectScreen);
    window.addEventListener('click_screen_element', handleClickScreenElement);
    window.addEventListener('scroll_screen', handleScrollScreen);
    window.addEventListener('youtube_control', handleYouTubeControl);
    window.addEventListener('whatsapp_draft', handleWhatsAppDraft);
    window.addEventListener('whatsapp_confirm', handleWhatsAppConfirm);
    window.addEventListener('simulate_phone_event', handleSimulatePhoneEvent);

    return () => {
      window.removeEventListener('device_control', handleDeviceControl);
      window.removeEventListener('send_sms', handleSendSMS);
      window.removeEventListener('reply_sms', handleReplySMS);
      window.removeEventListener('call_control', handleCallControl);
      window.removeEventListener('manage_apps', handleManageApps);
      window.removeEventListener('inspect_screen', handleInspectScreen);
      window.removeEventListener('click_screen_element', handleClickScreenElement);
      window.removeEventListener('scroll_screen', handleScrollScreen);
      window.removeEventListener('youtube_control', handleYouTubeControl);
      window.removeEventListener('whatsapp_draft', handleWhatsAppDraft);
      window.removeEventListener('whatsapp_confirm', handleWhatsAppConfirm);
      window.removeEventListener('simulate_phone_event', handleSimulatePhoneEvent);
    };
  }, [whatsappDraft, activeAlert, executeAppAction, handleIncomingCall, handleIncomingSMS, triggerIntruderAlert, userName, speakAloud]);

  // Update status message
  useEffect(() => {
    if (error) {
      setAgentStatus('Error: ' + error);
    } else if (isConnecting) {
      setAgentStatus('Connecting to Mahi...');
    } else if (isSpeaking) {
      setAgentStatus('Mahi Speaking...');
    } else if (connected) {
      setAgentStatus('Listening (Mic Active)');
    } else if (wakeWordEnabled) {
      setAgentStatus("Always Ready: Say 'Hey Mahi'");
    } else {
      setAgentStatus('Assistant Idle • Tap mic');
    }
  }, [connected, isConnecting, isSpeaking, error, wakeWordEnabled]);

  return (
    <div className="relative w-full h-[100dvh] bg-black text-white overflow-hidden font-sans flex flex-col select-none">
      {/* Edge Glow around screen */}
      <GeminiEdgeGlow
        isActive={connected || isSpeaking}
        volume={userVolume}
        isSpeaking={isSpeaking}
        activeTheme={activeTheme}
      />

      {/* 3D Cosmic Space with Celestial Crystal Avatar (Preserved Original 3D Model) */}
      <div
        className="absolute inset-0 z-0 bg-black cursor-pointer"
        onClick={(e) => {
          if (!connected && !showSettings && e.target === e.currentTarget) {
            handleConnect();
          }
        }}
      >
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1]} className="pointer-events-auto">
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <pointLight position={[-5, -5, -5]} intensity={1} color={activeTheme} />

          <Stars radius={100} depth={50} count={450} factor={4} saturation={0} fade speed={2} />

          <Suspense fallback={null}>
            <Avatar analyser={analyser} isSpeaking={isSpeaking} />
          </Suspense>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minPolarAngle={Math.PI / 2 - 0.2}
            autoRotate={true}
            autoRotateSpeed={2}
          />
        </Canvas>
      </div>

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4 pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-colors shadow-lg active:scale-95"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setShowFaceModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
              isFaceVerified
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isFaceVerified ? 'Face Guard Active' : 'Face Setup'}</span>
          </button>
        </div>

        {/* Top Status Capsule */}
        <div
          className="bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border shadow-xl flex items-center gap-2"
          style={{ borderColor: activeTheme, boxShadow: `0 0 12px ${activeTheme}40` }}
        >
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'animate-pulse' : 'bg-cyan-400'}`}
            style={{ backgroundColor: activeTheme }}
          />
          <span className="text-white text-xs font-semibold">{agentStatus}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Neon Theme Toggle */}
          <button
            onClick={() => setThemeIndex((prev) => (prev + 1) % THEMES.length)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            title="Switch Neon Color"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activeTheme, boxShadow: `0 0 8px ${activeTheme}` }}
            />
          </button>

          {connected && (
            <button
              onClick={disconnect}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs hover:bg-red-500/30 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </header>

      {/* Live Incoming Call / SMS / Intruder Notification Banner */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className={`absolute top-16 inset-x-4 z-40 max-w-md mx-auto p-4 rounded-2xl backdrop-blur-xl border-2 shadow-2xl flex items-center justify-between pointer-events-auto ${
              activeAlert.type === 'intruder'
                ? 'bg-red-950/90 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse'
                : activeAlert.type === 'call'
                ? 'bg-emerald-950/90 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
                : 'bg-blue-950/90 border-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.4)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  activeAlert.type === 'intruder'
                    ? 'bg-red-500 text-white'
                    : activeAlert.type === 'call'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {activeAlert.type === 'intruder' && <Siren className="w-6 h-6 animate-spin" />}
                {activeAlert.type === 'call' && <Phone className="w-6 h-6 animate-bounce" />}
                {activeAlert.type === 'sms' && <MessageSquare className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{activeAlert.title}</h4>
                <p className="text-xs text-white/80">{activeAlert.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeAlert.type === 'sms' && activeAlert.sender && (
                <button
                  onClick={() => {
                    setSmsModalProps({
                      recipient: activeAlert.sender,
                      isReply: true,
                    });
                    setShowSMSModal(true);
                    setActiveAlert(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md"
                >
                  Reply
                </button>
              )}
              {activeAlert.type === 'call' && activeAlert.sender && (
                <button
                  onClick={() => {
                    executeAppAction('voice_call', activeAlert.sender || '');
                    setActiveAlert(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md"
                >
                  Call Back
                </button>
              )}
              <button
                onClick={() => setActiveAlert(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube Voice Controller Floating Panel */}
      <AnimatePresence>
        {youtubeState && youtubeState.active && (
          <YouTubeController
            currentQuery={youtubeState.query}
            onClose={() => setYoutubeState(null)}
            onAction={(action) => executeAppAction(action, 'YouTube', youtubeState.query)}
          />
        )}
      </AnimatePresence>

      {/* WhatsApp Confirmation Protocol Modal */}
      <AnimatePresence>
        {whatsappDraft && (
          <WhatsAppConfirmModal
            recipient={whatsappDraft.recipient}
            message={whatsappDraft.message}
            onConfirm={() => {
              const cleanNum = whatsappDraft.recipient.replace(/[^0-9+]/g, '');
              const msg = encodeURIComponent(whatsappDraft.message);
              if (cleanNum) {
                window.open(`https://api.whatsapp.com/send?phone=${cleanNum}&text=${msg}`, '_blank');
              } else {
                window.open('whatsapp://', '_blank');
              }
              setWhatsappDraft(null);
            }}
            onCancel={() => {
              setWhatsappDraft(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* SMS Compose & Reply Modal */}
      <AnimatePresence>
        {showSMSModal && (
          <SMSModal
            onClose={() => setShowSMSModal(false)}
            onSendSMS={(rec, msg) => executeAppAction('send_sms', rec, msg)}
            initialRecipient={smsModalProps.recipient}
            initialMessage={smsModalProps.message}
            isReplyMode={smsModalProps.isReply}
          />
        )}
      </AnimatePresence>

      {/* Phone Call & Dialer Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <PhoneCallModal
            onClose={() => setShowPhoneModal(false)}
            onInitiateCall={(num) => executeAppAction('voice_call', num)}
          />
        )}
      </AnimatePresence>

      {/* Face ID Modal */}
      <AnimatePresence>
        {showFaceModal && (
          <FaceVerificationModal
            onClose={() => setShowFaceModal(false)}
            onVerifiedSuccess={() => setIsFaceVerified(true)}
            isAlreadyVerified={isFaceVerified}
            onIntruderDetected={triggerIntruderAlert}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            voice={voice}
            setVoice={setVoice}
            wakeWordEnabled={wakeWordEnabled}
            setWakeWordEnabled={setWakeWordEnabled}
            isFaceVerified={isFaceVerified}
            onOpenFaceVerification={() => setShowFaceModal(true)}
            onTriggerIntruderAlert={triggerIntruderAlert}
            onSimulateCall={handleIncomingCall}
            onSimulateSMS={handleIncomingSMS}
            onApiKeySaved={(newKey) => {
              if (connected) {
                disconnect();
                setTimeout(() => handleConnect(newKey), 400);
              }
            }}
            onUserNameSaved={(newName) => {
              setUserName(newName);
            }}
          />
        )}
      </AnimatePresence>

      {/* BOTTOM CONTROL DOCK: Sleek, non-intrusive action dock (2D Orb removed completely) */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-end pb-6 px-4 pointer-events-none">
        {/* Missing API Key Warning Toast */}
        {missingKeyPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 px-5 py-2.5 rounded-2xl bg-amber-950/95 border border-amber-500/60 text-amber-300 text-xs font-bold pointer-events-auto backdrop-blur-md shadow-2xl max-w-sm text-center flex items-center gap-2"
          >
            <span>⚠️ Please enter and save your Gemini API Key in Settings first.</span>
          </motion.div>
        )}

        {/* Error notification banner */}
        {error && (
          <div className="mb-3 px-5 py-2.5 rounded-2xl bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-semibold pointer-events-auto backdrop-blur-md shadow-2xl max-w-sm text-center">
            {error}
          </div>
        )}

        {/* Minimal Audio Equalizer Bar when Speaking or Listening */}
        {(connected || isSpeaking) && (
          <div className="flex items-center gap-1 mb-3 pointer-events-none">
            {[40, 70, 100, 60, 90, 50, 80].map((h, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [6, isSpeaking ? (h * 0.35) : (h * userVolume * 0.3 + 6), 6],
                }}
                transition={{
                  duration: 0.4 + i * 0.05,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-1 rounded-full"
                style={{ backgroundColor: activeTheme, boxShadow: `0 0 6px ${activeTheme}` }}
              />
            ))}
          </div>
        )}

        {/* Floating Command Dock */}
        <div className="pointer-events-auto flex items-center gap-3 bg-zinc-950/90 border border-white/15 px-5 py-3 rounded-full backdrop-blur-xl shadow-2xl">
          {/* Dialer Button */}
          <button
            onClick={() => setShowPhoneModal(true)}
            className="p-2.5 rounded-full bg-white/5 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300 transition-colors"
            title="Open Phone Dialer"
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* SMS Button */}
          <button
            onClick={() => {
              setSmsModalProps({});
              setShowSMSModal(true);
            }}
            className="p-2.5 rounded-full bg-white/5 hover:bg-blue-500/20 text-white/70 hover:text-blue-300 transition-colors"
            title="Send or Reply SMS"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Central Mic Toggle Button (Sleek Glass Circle) */}
          <button
            onClick={() => {
              if (connected) {
                disconnect();
              } else {
                handleConnect();
              }
            }}
            className="relative p-4 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg"
            style={{
              backgroundColor: connected ? activeTheme : '#ffffff15',
              boxShadow: connected ? `0 0 25px ${activeTheme}` : '0 0 10px rgba(255,255,255,0.1)',
            }}
            title={connected ? 'Disconnect Microphone' : 'Activate Assistant Microphone'}
          >
            {connected ? (
              <Mic className="w-6 h-6 text-black animate-pulse" />
            ) : (
              <MicOff className="w-6 h-6 text-white/80" />
            )}
          </button>

          {/* Security Intruder Siren Test Button */}
          <button
            onClick={() => triggerIntruderAlert()}
            className="p-2.5 rounded-full bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-300 transition-colors"
            title="Test Security Siren"
          >
            <Siren className="w-5 h-5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-full bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 transition-colors"
            title="Assistant Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
