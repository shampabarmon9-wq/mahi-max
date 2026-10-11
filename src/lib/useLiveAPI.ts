import { useRef, useState, useCallback, useEffect } from 'react';
import { backgroundKeepalive } from './backgroundKeepalive';

export function useLiveAPI() {
  const openedWindowRef = useRef<Window | null>(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isSpeakingTimerRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);

  const nextStartTimeRef = useRef<number>(0);

  // Complete shutdown - guarantees zero microphone or audio activity
  const disconnect = useCallback(() => {
    backgroundKeepalive.stop();

    if (wsRef.current) {
      const activeWs = wsRef.current;
      wsRef.current = null;
      try {
        activeWs.onopen = null;
        activeWs.onerror = null;
        activeWs.onclose = null;
        activeWs.onmessage = null;
        if (activeWs.readyState === WebSocket.OPEN) {
          activeWs.send(JSON.stringify({ end: true }));
        }
        activeWs.close();
      } catch (e) {}
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (e) {}
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try {
          t.enabled = false;
          t.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try { inputAudioCtxRef.current.close(); } catch (e) {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try { outputAudioCtxRef.current.close(); } catch (e) {}
      outputAudioCtxRef.current = null;
    }
    audioSourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    audioSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    if (isSpeakingTimerRef.current) {
      clearTimeout(isSpeakingTimerRef.current);
    }
    isSpeakingRef.current = false;
    setConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
  }, []);

  // Resume suspended audio contexts when tab regains focus or visibility
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (inputAudioCtxRef.current && inputAudioCtxRef.current.state === 'suspended') {
          inputAudioCtxRef.current.resume().catch(() => {});
        }
        if (outputAudioCtxRef.current && outputAudioCtxRef.current.state === 'suspended') {
          outputAudioCtxRef.current.resume().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const playAudioChunk = async (base64Audio: string) => {
    const ctx = outputAudioCtxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch (e) {}
    }

    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const buffer = bytes.buffer;

      // Gemini Live raw 16-bit PCM little-endian at 24kHz
      const int16Array = new Int16Array(buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      audioSourcesRef.current.push(source);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current === 0 || nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.05;
      }
      source.start(nextStartTimeRef.current);

      isSpeakingRef.current = true;
      setIsSpeaking(true);
      if (isSpeakingTimerRef.current) clearTimeout(isSpeakingTimerRef.current);

      source.onended = () => {
        audioSourcesRef.current = audioSourcesRef.current.filter(s => s !== source);
        if (audioSourcesRef.current.length === 0) {
          isSpeakingTimerRef.current = setTimeout(() => {
            isSpeakingRef.current = false;
            setIsSpeaking(false);
          }, 350);
        }
      };

      nextStartTimeRef.current += audioBuffer.duration;
    } catch (err) {
      console.error("Error playing audio chunk", err);
    }
  };

  const connect = useCallback(async (explicitKey?: string, selectedVoice: string = 'female_1') => {
    try {
      setIsConnecting(true);
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported or blocked in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: false,
      });
      streamRef.current = stream;

      // Prefer user configured key from localStorage if available
      let storedKey = '';
      let storedUser = '';
      try {
        storedKey = localStorage.getItem('mahi_api_key') || '';
        storedUser = localStorage.getItem('mahi_user_name') || '';
      } catch (e) {}

      const keyToUse = (explicitKey && explicitKey.trim()) || (storedKey && storedKey.trim()) || "default";
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const encodedUser = encodeURIComponent(storedUser);
      const wsUrl = `${protocol}//${host}/ws/live?key=${encodeURIComponent(keyToUse)}&voice=${encodeURIComponent(selectedVoice)}&user=${encodedUser}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Connected to backend proxy, waiting for Gemini Live handshake
      };

      ws.onerror = (e) => {
        console.warn("Live voice WebSocket event:", e);
        setError((prev) => prev || "Could not establish Gemini Live connection. Please check your API key.");
        setIsConnecting(false);
        disconnect();
      };

      ws.onclose = (event) => {
        if (event.code === 1008 || (event.reason && event.reason.includes("API_KEY"))) {
          setError("Invalid Google AI Studio API Key. Please update it in Settings.");
        }
        setIsConnecting(false);
        disconnect();
      };

      // Set up Web Audio Input capture at 16kHz
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;

      const outAnalyser = outputCtx.createAnalyser();
      outAnalyser.fftSize = 256;
      outAnalyser.connect(outputCtx.destination);
      analyserRef.current = outAnalyser;

      const inAnalyser = inputCtx.createAnalyser();
      inAnalyser.fftSize = 256;
      inputAnalyserRef.current = inAnalyser;

      streamRef.current = stream;
      const source = inputCtx.createMediaStreamSource(stream);
      source.connect(inAnalyser);

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        // Microphone audio gating: do NOT send audio back to Gemini when Mahi is currently speaking
        if (ws.readyState === WebSocket.OPEN && !isSpeakingRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          const base64 = pcmToBase64(inputData);
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            console.warn("Live voice server error:", msg.error);
            setError(msg.error);
            setTimeout(() => setError(null), 10000);
            setIsConnecting(false);
            setTimeout(() => disconnect(), 400);
            return;
          }
          if (msg.ready) {
            setIsConnecting(false);
            setConnected(true);
            backgroundKeepalive.start();
            return;
          }
        if (msg.openUrl) {
          const newWindow = window.open(msg.openUrl, '_blank');
          openedWindowRef.current = newWindow;
          if (!newWindow) {
            setPendingUrl(msg.openUrl);
          }
        }
        if (msg.closeUrl) {
          if (openedWindowRef.current) {
            openedWindowRef.current.close();
            openedWindowRef.current = null;
          }
        }
        if (msg.sendSMS) {
          const evt = new CustomEvent('send_sms', { detail: msg.sendSMS });
          window.dispatchEvent(evt);
        }
        if (msg.replySMS) {
          const evt = new CustomEvent('reply_sms', { detail: msg.replySMS });
          window.dispatchEvent(evt);
        }
        if (msg.controlDevice) {
          const evt = new CustomEvent('device_control', { detail: msg.controlDevice });
          window.dispatchEvent(evt);
        }
        if (msg.inspectScreen) {
          const evt = new CustomEvent('inspect_screen', { detail: msg.inspectScreen });
          window.dispatchEvent(evt);
        }
        if (msg.clickScreenElement) {
          const evt = new CustomEvent('click_screen_element', { detail: msg.clickScreenElement });
          window.dispatchEvent(evt);
        }
        if (msg.scrollScreen) {
          const evt = new CustomEvent('scroll_screen', { detail: msg.scrollScreen });
          window.dispatchEvent(evt);
        }
        if (msg.controlYouTube) {
          const evt = new CustomEvent('youtube_control', { detail: msg.controlYouTube });
          window.dispatchEvent(evt);
        }
        if (msg.draftWhatsApp) {
          const evt = new CustomEvent('whatsapp_draft', { detail: msg.draftWhatsApp });
          window.dispatchEvent(evt);
        }
        if (msg.confirmWhatsApp) {
          const evt = new CustomEvent('whatsapp_confirm', { detail: msg.confirmWhatsApp });
          window.dispatchEvent(evt);
        }
        if (msg.controlCall) {
          const evt = new CustomEvent('call_control', { detail: msg.controlCall });
          window.dispatchEvent(evt);
        }
        if (msg.manageApps) {
          const evt = new CustomEvent('manage_apps', { detail: msg.manageApps });
          window.dispatchEvent(evt);
        }
        if (msg.simulatePhoneEvent) {
          const evt = new CustomEvent('simulate_phone_event', { detail: msg.simulatePhoneEvent });
          window.dispatchEvent(evt);
        }
        if (msg.interrupted) {
          audioSourcesRef.current.forEach(s => {
            try { s.stop(); } catch (e) {}
          });
          audioSourcesRef.current = [];
          nextStartTimeRef.current = 0;
          isSpeakingRef.current = false;
          setIsSpeaking(false);
        }
        if (msg.audio) {
          await playAudioChunk(msg.audio);
        }
      } catch (e) {
        console.warn("Error processing live audio/data message:", e);
      }
    };

    } catch (err: any) {
      console.warn("Microphone connection error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.toLowerCase().includes('denied') || err.message?.toLowerCase().includes('permission')) {
        setError("Microphone permission was denied. Please allow microphone in your browser settings to speak with Mahi (माइक की अनुमति दें).");
      } else {
        setError(err.message || "Failed to connect microphone");
      }
      setTimeout(() => setError(null), 7000);
      setIsConnecting(false);
      disconnect();
    }
  }, [disconnect]);

  const sendText = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
    }
  }, []);

  return {
    sendText,
    connected,
    isConnecting,
    isSpeaking,
    error,
    pendingUrl,
    setPendingUrl,
    connect,
    disconnect,
    analyser: analyserRef.current,
    inputAnalyser: inputAnalyserRef.current,
  };
}

function pcmToBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
