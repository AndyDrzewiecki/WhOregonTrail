'use client';
import React from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import styles from './CommandBar.module.css';

interface Props {
  onSubmit: (text: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export default function CommandBar({ onSubmit, placeholder = 'What do you say...', disabled }: Props) {
  const [text, setText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleVoiceTranscript = React.useCallback((transcript: string) => {
    setText(transcript);
    textareaRef.current?.focus();
  }, []);

  const { voiceState, liveTranscript, startListening, stopListening } = useVoiceInput(handleVoiceTranscript);

  const handleSubmit = React.useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting || disabled) return;
    setSubmitting(true);
    try { await onSubmit(trimmed); }
    finally { setText(''); setSubmitting(false); }
  }, [text, submitting, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const displayText = voiceState === 'listening' && liveTranscript ? liveTranscript : text;

  return (
    <div className={styles.bar}>
      {voiceState === 'listening' && (
        <div className={styles.voiceIndicator}>Listening...</div>
      )}
      {voiceState === 'listening' && liveTranscript && (
        <p style={{ fontSize: '0.6rem', color: 'var(--muted)', margin: '0 0 4px', fontStyle: 'italic' }}>
          Speaking... transcript will submit automatically
        </p>
      )}
      <div className={styles.inner}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          rows={1}
          value={displayText}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Waiting...' : placeholder}
          disabled={disabled || submitting}
          aria-label="Command input"
        />
        <button
          className={styles.sendBtn}
          onClick={handleSubmit}
          disabled={!text.trim() || submitting || disabled}
          aria-label="Send"
        >
          {submitting ? '...' : '\u2192'}
        </button>
        {voiceState !== 'unsupported' && (
          <button
            className={`${styles.voiceBtn} ${voiceState === 'listening' ? styles.listening : ''}`}
            onPointerDown={startListening}
            onPointerUp={stopListening}
            onPointerLeave={stopListening}
            disabled={disabled || submitting}
            aria-label={voiceState === 'listening' ? 'Release to send voice' : 'Hold to speak'}
            title="Hold to speak"
          >
            &#x25C9;
          </button>
        )}
      </div>
    </div>
  );
}
