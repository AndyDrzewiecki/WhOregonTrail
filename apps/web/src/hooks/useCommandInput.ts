'use client';
import { useState, useCallback } from 'react';

export type InputState = 'IDLE' | 'TYPING' | 'VOICE_LISTENING' | 'VOICE_TRANSCRIPT' | 'SUBMITTING';

export function useCommandInput(onSubmit: (text: string) => Promise<void>) {
  const [inputState, setInputState] = useState<InputState>('IDLE');
  const [text, setText] = useState('');

  const handleChange = useCallback((value: string) => {
    setText(value);
    setInputState(value.length > 0 ? 'TYPING' : 'IDLE');
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || inputState === 'SUBMITTING') return;
    setInputState('SUBMITTING');
    try {
      await onSubmit(trimmed);
    } finally {
      setText('');
      setInputState('IDLE');
    }
  }, [text, inputState, onSubmit]);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setText(transcript);
    setInputState('VOICE_TRANSCRIPT');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return {
    text,
    inputState,
    handleChange,
    handleSubmit,
    handleVoiceTranscript,
    handleKeyDown,
    isSubmitting: inputState === 'SUBMITTING',
  };
}
