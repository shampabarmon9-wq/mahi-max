import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWakeWordOptions {
  enabled: boolean;
  onWakeWord: (detectedPhrase: string) => void;
  lang?: string;
  isAssistantSpeaking?: boolean;
}

export function useWakeWord({
  enabled,
  onWakeWord,
  lang = 'hi-IN',
  isAssistantSpeaking = false,
}: UseWakeWordOptions) {
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [lastWakeWordTime, setLastWakeWordTime] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const shouldRunRef = useRef(enabled);
  const onWakeWordRef = useRef(onWakeWord);
  const cooldownRef = useRef(false);
  const isStartedRef = useRef(false);
  const isSpeakingRef = useRef(isAssistantSpeaking);

  useEffect(() => {
    onWakeWordRef.current = onWakeWord;
  }, [onWakeWord]);

  useEffect(() => {
    shouldRunRef.current = enabled;
    if (!enabled && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
      isStartedRef.current = false;
      setIsListeningForWakeWord(false);
    }
  }, [enabled]);

  useEffect(() => {
    isSpeakingRef.current = isAssistantSpeaking;
  }, [isAssistantSpeaking]);

  const matchesWakeWord = useCallback((transcript: string): boolean => {
    const text = transcript.toLowerCase().trim();
    // Support English, Hindi, and Bengali variations
    const triggers = [
      'hey mahi',
      'hi mahi',
      'hello mahi',
      'mahi',
      'he mahi',
      'mayi',
      'hey mayi',
      'hai mahi',
      'oye mahi',
      'sun mahi',
      'हे माही',
      'माही',
      'सुन माही',
      'हे माहि',
      'মাহি',
      'মাহী',
      'হে মাহী'
    ];

    return triggers.some((trig) => text.includes(trig));
  }, []);

  const triggerWakeWord = useCallback((phrase: string) => {
    if (cooldownRef.current || isSpeakingRef.current) return;

    cooldownRef.current = true;
    setLastWakeWordTime(Date.now());

    onWakeWordRef.current(phrase);

    setTimeout(() => {
      cooldownRef.current = false;
    }, 3000);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      isStartedRef.current = false;
      setIsListeningForWakeWord(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    let recognition: any;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = lang;
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Failed to initialize SpeechRecognition:', e);
      return;
    }

    recognition.onstart = () => {
      isStartedRef.current = true;
      setIsListeningForWakeWord(true);
    };

    recognition.onresult = (event: any) => {
      if (isSpeakingRef.current || cooldownRef.current) return;

      const results = event.results;
      for (let i = event.resultIndex; i < results.length; i++) {
        const item = results[i];
        for (let j = 0; j < item.length; j++) {
          const transcript = item[j].transcript;
          if (matchesWakeWord(transcript)) {
            triggerWakeWord(transcript);
            return;
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.warn('Wake word permission denied:', event.error);
        shouldRunRef.current = false;
        isStartedRef.current = false;
        setIsListeningForWakeWord(false);
        try {
          recognition.abort();
        } catch (e) {}
        return;
      }
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Wake word recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      isStartedRef.current = false;
      setIsListeningForWakeWord(false);

      if (shouldRunRef.current && !isSpeakingRef.current && recognitionRef.current) {
        setTimeout(() => {
          if (shouldRunRef.current && recognitionRef.current && !isStartedRef.current && !isSpeakingRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              shouldRunRef.current = false;
            }
          }
        }, 1000);
      }
    };

    if (enabled && !isStartedRef.current && !isAssistantSpeaking) {
      try {
        recognition.start();
      } catch (e) {
        shouldRunRef.current = false;
      }
    }

    return () => {
      shouldRunRef.current = false;
      isStartedRef.current = false;
      try {
        if (recognition) {
          recognition.abort();
          recognition.stop();
        }
      } catch (e) {}
      recognitionRef.current = null;
    };
  }, [enabled, lang, isAssistantSpeaking, matchesWakeWord, triggerWakeWord]);

  return {
    isListeningForWakeWord,
    lastWakeWordTime,
    triggerManualWake: () => triggerWakeWord('manual'),
  };
}
