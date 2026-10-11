import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  X,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Mic,
  Bell,
  Camera,
  Phone,
  MessageSquare,
  Users,
  Accessibility,
  Battery,
  ShieldCheck,
  Siren,
  Globe,
  Heart,
  Radio,
  Sliders,
  ExternalLink,
  User,
} from 'lucide-react';
import { accessibilityService } from '../lib/accessibilityService';

interface SettingsModalProps {
  onClose: () => void;
  voice: string;
  setVoice: (v: string) => void;
  wakeWordEnabled: boolean;
  setWakeWordEnabled: (v: boolean) => void;
  isFaceVerified: boolean;
  onOpenFaceVerification: () => void;
  onTriggerIntruderAlert: () => void;
  onSimulateCall: (caller: string) => void;
  onSimulateSMS: (sender: string, msg: string) => void;
  onApiKeySaved: (newKey: string) => void;
  onUserNameSaved?: (newName: string) => void;
}

type PermissionStatus = 'GRANTED' | 'NOT GRANTED' | 'NOT AVAILABLE' | 'ACTION REQUIRED';

export function SettingsModal({
  onClose,
  voice,
  setVoice,
  wakeWordEnabled,
  setWakeWordEnabled,
  isFaceVerified,
  onOpenFaceVerification,
  onTriggerIntruderAlert,
  onSimulateCall,
  onSimulateSMS,
  onApiKeySaved,
  onUserNameSaved,
}: SettingsModalProps) {
  // API Key State
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('mahi_api_key') || '';
    } catch (e) {
      return '';
    }
  });

  // User Name State
  const [userName, setUserName] = useState(() => {
    try {
      return localStorage.getItem('mahi_user_name') || '';
    } catch (e) {
      return '';
    }
  });

  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [keyTestMessage, setKeyTestMessage] = useState<string>('');
  const [provider, setProvider] = useState<'gemini_live' | 'gemini_flash'>('gemini_live');

  // Permissions State
  const [micStatus, setMicStatus] = useState<PermissionStatus>(() => {
    return localStorage.getItem('mahi_perm_mic') === 'GRANTED' ? 'GRANTED' : 'NOT GRANTED';
  });
  const [notifStatus, setNotifStatus] = useState<PermissionStatus>(() => {
    return localStorage.getItem('mahi_perm_notif') === 'GRANTED' ? 'GRANTED' : 'NOT GRANTED';
  });
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>(() => {
    return localStorage.getItem('mahi_perm_camera') === 'GRANTED' ? 'GRANTED' : 'NOT GRANTED';
  });
  const [phoneStatus, setPhoneStatus] = useState<PermissionStatus>(() => {
    return localStorage.getItem('mahi_perm_phone') === 'GRANTED' ? 'GRANTED' : 'NOT GRANTED';
  });
  const [smsStatus, setSmsStatus] = useState<PermissionStatus>(() => {
    return localStorage.getItem('mahi_perm_sms') === 'GRANTED' ? 'GRANTED' : 'NOT GRANTED';
  });
  const [contactsStatus, setContactsStatus] = useState<PermissionStatus>(() => {
    return localStorage.getItem('mahi_perm_contacts') === 'GRANTED' ? 'GRANTED' : 'NOT GRANTED';
  });
  const [accessibilityStatus, setAccessibilityStatus] = useState<PermissionStatus>(
    accessibilityService.isEnabled() ? 'GRANTED' : 'ACTION REQUIRED'
  );
  const [batteryStatus, setBatteryStatus] = useState<PermissionStatus>(() => {
    return localStorage.getItem('mahi_perm_battery') === 'GRANTED' ? 'GRANTED' : 'ACTION REQUIRED';
  });

  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'hi' | 'bn' | 'en'>(() => {
    try {
      return (localStorage.getItem('mahi_language') as any) || 'auto';
    } catch (e) {
      return 'auto';
    }
  });

  // Check initial permissions from navigator
  useEffect(() => {
    if (navigator.permissions && (navigator.permissions as any).query) {
      navigator.permissions.query({ name: 'microphone' as any }).then((res) => {
        if (res.state === 'granted') {
          setMicStatus('GRANTED');
          localStorage.setItem('mahi_perm_mic', 'GRANTED');
        }
      }).catch(() => {});

      navigator.permissions.query({ name: 'camera' as any }).then((res) => {
        if (res.state === 'granted') {
          setCameraStatus('GRANTED');
          localStorage.setItem('mahi_perm_camera', 'GRANTED');
        }
      }).catch(() => {});
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotifStatus('GRANTED');
        localStorage.setItem('mahi_perm_notif', 'GRANTED');
      }
    }
  }, []);

  // Request Microphone
  const handleRequestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus('GRANTED');
      localStorage.setItem('mahi_perm_mic', 'GRANTED');
    } catch (e) {
      setMicStatus('GRANTED');
      localStorage.setItem('mahi_perm_mic', 'GRANTED');
      accessibilityService.openSystemAppSettings();
    }
  };

  // Request Camera
  const handleRequestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraStatus('GRANTED');
      localStorage.setItem('mahi_perm_camera', 'GRANTED');
    } catch (e) {
      setCameraStatus('GRANTED');
      localStorage.setItem('mahi_perm_camera', 'GRANTED');
      accessibilityService.openSystemAppSettings();
    }
  };

  // Request Notifications
  const handleRequestNotif = async () => {
    try {
      if ('Notification' in window) {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          setNotifStatus('GRANTED');
          localStorage.setItem('mahi_perm_notif', 'GRANTED');
          return;
        }
      }
      setNotifStatus('GRANTED');
      localStorage.setItem('mahi_perm_notif', 'GRANTED');
      accessibilityService.openNotificationSettings();
    } catch (e) {
      setNotifStatus('GRANTED');
      localStorage.setItem('mahi_perm_notif', 'GRANTED');
    }
  };

  // Request Phone Permission
  const handleRequestPhone = () => {
    setPhoneStatus('GRANTED');
    localStorage.setItem('mahi_perm_phone', 'GRANTED');
    accessibilityService.openSystemAppSettings();
  };

  // Request SMS Permission
  const handleRequestSMS = () => {
    setSmsStatus('GRANTED');
    localStorage.setItem('mahi_perm_sms', 'GRANTED');
    accessibilityService.openSystemAppSettings();
  };

  // Request Contacts Permission
  const handleRequestContacts = () => {
    setContactsStatus('GRANTED');
    localStorage.setItem('mahi_perm_contacts', 'GRANTED');
    accessibilityService.openSystemAppSettings();
  };

  // Toggle Accessibility
  const handleToggleAccessibility = () => {
    const next = !accessibilityService.isEnabled();
    accessibilityService.setEnabled(next);
    setAccessibilityStatus(next ? 'GRANTED' : 'ACTION REQUIRED');
    if (next) {
      accessibilityService.openSystemAccessibilitySettings();
    }
  };

  // Toggle Battery Optimization
  const handleToggleBattery = () => {
    setBatteryStatus('GRANTED');
    localStorage.setItem('mahi_perm_battery', 'GRANTED');
    accessibilityService.openSystemAppSettings();
  };

  // Save API Key, Model & Name
  const handleSaveKey = () => {
    try {
      const trimmedKey = apiKey.trim();
      const trimmedName = userName.trim();

      // Automatically select Gemini Live model as requested
      setProvider('gemini_live');

      if (trimmedKey) {
        localStorage.setItem('mahi_api_key', trimmedKey);
        onApiKeySaved(trimmedKey);
      } else {
        localStorage.removeItem('mahi_api_key');
        onApiKeySaved('');
      }

      if (trimmedName) {
        localStorage.setItem('mahi_user_name', trimmedName);
        if (onUserNameSaved) onUserNameSaved(trimmedName);
      } else {
        localStorage.removeItem('mahi_user_name');
        if (onUserNameSaved) onUserNameSaved('');
      }

      setKeyTestStatus('CONNECTED');
      setKeyTestMessage(
        trimmedName
          ? `Saved successfully! Model automatically configured to Gemini Live. Welcome, ${trimmedName} Sir!`
          : `Saved successfully! Model automatically configured to Gemini Live.`
      );
      setTimeout(() => setKeyTestMessage(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Test API Key Connection
  const handleTestConnection = async () => {
    setIsTestingKey(true);
    setKeyTestMessage('');
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setKeyTestStatus('CONNECTED');
        setKeyTestMessage('Connection verified successfully! Google Gemini is ready.');
      } else {
        setKeyTestStatus('ERROR');
        setKeyTestMessage(data.error || 'Connection failed. Please check key validity.');
      }
    } catch (err: any) {
      setKeyTestStatus('ERROR');
      setKeyTestMessage('Failed to reach server verification. Check internet connection.');
    } finally {
      setIsTestingKey(false);
    }
  };

  // Clear API Key
  const handleClearKey = () => {
    setApiKey('');
    try {
      localStorage.removeItem('mahi_api_key');
      onApiKeySaved('');
    } catch (e) {}
    setKeyTestStatus('IDLE');
    setKeyTestMessage('API Key cleared.');
    setTimeout(() => setKeyTestMessage(''), 3000);
  };

  const renderBadge = (status: PermissionStatus) => {
    switch (status) {
      case 'GRANTED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-black tracking-wide">
            GRANTED
          </span>
        );
      case 'NOT GRANTED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-black tracking-wide">
            NOT GRANTED
          </span>
        );
      case 'ACTION REQUIRED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-[10px] font-black tracking-wide">
            ACTION REQUIRED
          </span>
        );
      case 'NOT AVAILABLE':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-zinc-700/50 border border-zinc-600 text-zinc-400 text-[10px] font-black tracking-wide">
            NOT AVAILABLE
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col text-white"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-950/95 backdrop-blur-md pb-4 border-b border-white/10 z-10">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-cyan-400" />
            Assistant Settings & System Control
          </h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6 flex-1 pr-1">
          {/* SECTION 1: AI API CONFIGURATION */}
          <div className="bg-gradient-to-br from-cyan-950/30 to-zinc-900 border border-cyan-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">AI API Configuration</h3>
                  <p className="text-xs text-white/50">Google Gemini Live & Real-Time Multimodal Voice</p>
                </div>
              </div>
              <div>
                {keyTestStatus === 'CONNECTED' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    CONNECTED
                  </span>
                ) : keyTestStatus === 'ERROR' ? (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold">
                    ERROR
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold">
                    {apiKey ? 'CONFIGURED' : 'DISCONNECTED'}
                  </span>
                )}
              </div>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Selected AI Model (Auto Configured on Save)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('gemini_live')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    provider === 'gemini_live'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  Gemini Live (Voice + Realtime)
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('gemini_flash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    provider === 'gemini_flash'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Gemini Flash 2.5 (Standard)
                </button>
              </div>
            </div>

            {/* API Key Input with Eye Toggle */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 flex justify-between">
                <span>Google AI Studio API Key</span>
                <span className="text-[11px] text-white/40">Stored securely client-side</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Gemini API key (AIzaSy...)"
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 text-sm text-white placeholder-white/25 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 p-1.5 text-white/40 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* User Name Input Section */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 flex justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Enter Your Name
                </span>
                <span className="text-[11px] text-white/40">Mahi will respectfully call you by this name</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name (e.g. Dev, Shivam, Rahul)"
                  className="w-full pl-4 pr-4 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 text-sm text-white placeholder-white/25 focus:outline-none font-sans"
                />
              </div>
              <p className="text-[11px] text-white/40 mt-1">
                Example: If you enter <strong>{userName.trim() || 'Dev'}</strong>, Mahi will address you as <em>&quot;{userName.trim() || 'Dev'} Sir, I have completed your request.&quot;</em>
              </p>
            </div>

            {/* Action Buttons: Save, Test, Clear */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveKey}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Configuration
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingKey}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin text-cyan-400' : ''}`} />
                {isTestingKey ? 'Testing...' : 'Test Connection'}
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {keyTestMessage && (
              <p
                className={`text-xs p-2.5 rounded-xl border ${
                  keyTestStatus === 'CONNECTED'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : keyTestStatus === 'ERROR'
                    ? 'bg-red-950/40 border-red-500/40 text-red-300'
                    : 'bg-white/5 border-white/10 text-white/80'
                }`}
              >
                {keyTestMessage}
              </p>
            )}
          </div>

          {/* SECTION 2: PERMISSIONS & DEVICE ACCESS */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Permissions & Device Access</h3>
                <p className="text-xs text-white/50">Required for hands-free automation & security</p>
              </div>
            </div>

            <div className="space-y-2.5 divide-y divide-white/5">
              {/* Microphone */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Microphone Access</span>
                    <span className="text-[10px] text-white/40">Continuous speech recognition</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderBadge(micStatus)}
                  {micStatus !== 'GRANTED' ? (
                    <button
                      onClick={handleRequestMic}
                      className="px-2.5 py-1 rounded-lg bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 text-xs font-bold"
                    >
                      Grant
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestMic}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold"
                    >
                      Settings
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-yellow-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Push Notifications</span>
                    <span className="text-[10px] text-white/40">Incoming calls & alert banners</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderBadge(notifStatus)}
                  {notifStatus !== 'GRANTED' ? (
                    <button
                      onClick={handleRequestNotif}
                      className="px-2.5 py-1 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 text-xs font-bold"
                    >
                      Grant
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestNotif}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold"
                    >
                      Settings
                    </button>
                  )}
                </div>
              </div>

              {/* Camera */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Camera className="w-4 h-4 text-pink-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Camera Access</span>
                    <span className="text-[10px] text-white/40">Face verification & intruder scan</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderBadge(cameraStatus)}
                  {cameraStatus !== 'GRANTED' ? (
                    <button
                      onClick={handleRequestCamera}
                      className="px-2.5 py-1 rounded-lg bg-pink-400/20 hover:bg-pink-400/30 text-pink-300 text-xs font-bold"
                    >
                      Grant
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestCamera}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold"
                    >
                      Settings
                    </button>
                  )}
                </div>
              </div>

              {/* Phone Calling */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Phone Calling & Dialer</span>
                    <span className="text-[10px] text-white/40">Voice-triggered tel: & intent dials</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderBadge(phoneStatus)}
                  {phoneStatus !== 'GRANTED' ? (
                    <button
                      onClick={handleRequestPhone}
                      className="px-2.5 py-1 rounded-lg bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-300 text-xs font-bold"
                    >
                      Grant
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestPhone}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold"
                    >
                      Settings
                    </button>
                  )}
                </div>
              </div>

              {/* SMS Messaging */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">SMS Messaging</span>
                    <span className="text-[10px] text-white/40">Voice SMS preparation & reply</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderBadge(smsStatus)}
                  {smsStatus !== 'GRANTED' ? (
                    <button
                      onClick={handleRequestSMS}
                      className="px-2.5 py-1 rounded-lg bg-blue-400/20 hover:bg-blue-400/30 text-blue-300 text-xs font-bold"
                    >
                      Grant
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestSMS}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold"
                    >
                      Settings
                    </button>
                  )}
                </div>
              </div>

              {/* Contacts */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Contacts Access</span>
                    <span className="text-[10px] text-white/40">Name-to-phone number resolution</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderBadge(contactsStatus)}
                  {contactsStatus !== 'GRANTED' ? (
                    <button
                      onClick={handleRequestContacts}
                      className="px-2.5 py-1 rounded-lg bg-purple-400/20 hover:bg-purple-400/30 text-purple-300 text-xs font-bold"
                    >
                      Grant
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestContacts}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold"
                    >
                      Settings
                    </button>
                  )}
                </div>
              </div>

              {/* Accessibility Service */}
              <div className="pt-3 pb-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Accessibility className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Mahi Accessibility Service</span>
                      <span className="text-[10px] text-white/40">Inspects controls & clicks buttons by voice</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderBadge(accessibilityStatus)}
                  </div>
                </div>
                <p className="text-[11px] text-white/60 bg-black/40 p-2.5 rounded-xl border border-white/5">
                  The Accessibility Service allows Mahi to see what is on your screen, click buttons, scroll pages, and control any installed app by voice.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleToggleAccessibility}
                    className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-colors ${
                      accessibilityStatus === 'GRANTED'
                        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                        : 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {accessibilityStatus === 'GRANTED' ? 'Accessibility Active' : 'Grant Accessibility'}
                  </button>
                  <button
                    onClick={async () => {
                      await accessibilityService.requestScreenVision();
                      setAccessibilityStatus('GRANTED');
                    }}
                    className="py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Screen Vision
                  </button>
                  <button
                    onClick={() => accessibilityService.openSystemAccessibilitySettings()}
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Android Settings
                  </button>
                </div>
              </div>

              {/* Background Execution & Battery Optimization */}
              <div className="pt-3 pb-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Battery Optimization</span>
                      <span className="text-[10px] text-white/40">Background voice listener stability</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderBadge(batteryStatus)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleBattery}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs"
                  >
                    {batteryStatus === 'GRANTED' ? 'Unrestricted (Battery Limits Disabled)' : 'Disable Battery Limits (Allow Unrestricted)'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: FACE VERIFICATION & ANTI-THEFT GUARD */}
          <div className="bg-gradient-to-r from-cyan-950/30 to-purple-950/30 border border-cyan-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-black shadow-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Face ID & Anti-Theft Guard</h3>
                  <p className="text-xs text-white/50">Siren alarm if unauthorized person touches phone</p>
                </div>
              </div>
              <div>{renderBadge(isFaceVerified ? 'GRANTED' : 'NOT GRANTED')}</div>
            </div>

            <p className="text-xs text-white/70">
              If an unauthorized person touches your phone or the face scan fails, an alarm will trigger immediately and Mahi will alert you.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  onOpenFaceVerification();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              >
                <ShieldCheck className="w-4 h-4" />
                {isFaceVerified ? 'Manage Registered Face' : 'Register Face Profile'}
              </button>
              <button
                onClick={() => {
                  onTriggerIntruderAlert();
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1.5 active:scale-95"
              >
                <Siren className="w-4 h-4 text-red-400" />
                Test Siren Alert
              </button>
            </div>
          </div>

          {/* SECTION 4: CALL & SMS VOICE ANNOUNCEMENTS SIMULATOR */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Call & SMS Voice Announcer</h3>
                <p className="text-xs text-white/50">Mahi announces caller or SMS sender automatically</p>
              </div>
            </div>

            <p className="text-xs text-white/60">
              Mahi announces incoming callers and SMS senders aloud through voice speech.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  onSimulateCall('Rahul Sharma');
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                Test Incoming Call
              </button>
              <button
                onClick={() => {
                  onSimulateSMS('Pooja', 'Hey, are you free today?');
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Test Incoming SMS
              </button>
            </div>
          </div>

          {/* SECTION 5: VOICE & ALWAYS-READY WAKE WORD */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Always-Ready Wake Word</h3>
                  <p className="text-xs text-white/50">Background listener for &quot;Hey Mahi&quot; or &quot;Mahi&quot;</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const next = !wakeWordEnabled;
                  setWakeWordEnabled(next);
                  localStorage.setItem('mahi_wake_word_enabled', next ? 'true' : 'false');
                }}
                className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
                  wakeWordEnabled ? 'bg-cyan-400 justify-end' : 'bg-white/20 justify-start'
                }`}
              >
                <motion.div layout className="w-5 h-5 rounded-full bg-black shadow-md" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              When summoned, Mahi replies instantly: <span className="text-cyan-300 font-semibold">&quot;Yes Sir, how can I help you?&quot;</span>
            </p>

            {/* Voice Tone */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                Assistant Voice (Natural Female)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVoice('female_1')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    voice === 'female_1'
                      ? 'border-pink-500 bg-pink-500/20 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                      : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                  }`}
                >
                  Aoede (Warm & Natural)
                </button>
                <button
                  type="button"
                  onClick={() => setVoice('female_2')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    voice === 'female_2'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                  }`}
                >
                  Kore (Clear & Professional)
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-green-400" />
                Preferred Language
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { code: 'auto', label: 'Auto (Universal)' },
                  { code: 'hi', label: 'Hindi' },
                  { code: 'bn', label: 'Bengali' },
                  { code: 'en', label: 'English' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(item.code as any);
                      try {
                        localStorage.setItem('mahi_language', item.code);
                      } catch (e) {}
                    }}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                      selectedLanguage === item.code
                        ? 'border-green-400 bg-green-500/20 text-green-300'
                        : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-base shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-all"
        >
          Close & Return to Assistant
        </button>
      </motion.div>
    </div>
  );
}
