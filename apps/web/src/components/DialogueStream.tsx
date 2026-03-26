'use client';
import React, { useEffect, useRef } from 'react';
import styles from './DialogueStream.module.css';

export interface DisplayMessage {
  id: string;
  characterId?: string;
  characterName?: string;
  text: string;
  isPlayer?: boolean;
  isStreaming?: boolean;
}

interface Props {
  messages: DisplayMessage[];
}

export default function DialogueStream({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.stream}>
      {messages.map((msg) => (
        <div key={msg.id} className={`${styles.message} ${msg.isPlayer ? styles.player : styles.character} fade-in`}>
          {!msg.isPlayer && msg.characterName && (
            <span className={styles.speaker}>{msg.characterName.toUpperCase()}</span>
          )}
          <span className={styles.text}>
            {msg.text}
            {msg.isStreaming && <span className={styles.cursor} aria-hidden>&#x2588;</span>}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
