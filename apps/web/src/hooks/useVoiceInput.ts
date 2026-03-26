'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceState = 'idle' | 'listening' | 'unsupported';

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');

  useEffect(() => {
    const SR = window.SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) { setVoiceState('unsupported'); return; }
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t) : (interim += t);
      }
      setLiveTranscript(final || interim);
      if (final) { onTranscript(final.trim()); setLiveTranscript(''); }
    };
    r.onend = () => setVoiceState('idle');
    r.onerror = () => { setVoiceState('idle'); setLiveTranscript(''); };
    recognitionRef.current = r;
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || voiceState === 'unsupported') return;
    setVoiceState('listening');
    recognitionRef.current.start();
  }, [voiceState]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceState('idle');
  }, []);

  return { voiceState, liveTranscript, startListening, stopListening };
}
