'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import { streamDialogue } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

export default function CharacterIntroductions({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [exchanges, setExchanges] = useState(0);

  useEffect(() => {
    if (!state || messages.length > 0) return;
    const streamingId = 'intro-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let accumulated = '';
    streamDialogue(state, '__PARTY_ASSEMBLE__', (chunk) => {
      accumulated += chunk;
      setMessages([{ id: streamingId, text: accumulated, isStreaming: true }]);
    }).then((response) => {
      const display: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `intro-msg-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        text: d.text,
      }));
      setMessages(display);
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: 'Twelve faces look to you. Some hopeful. Some not.', isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state) return;
    const playerMsg: DisplayMessage = { id: `p-${Date.now()}`, text, isPlayer: true };
    const streamingId = `s-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);
    setInputEnabled(false);
    let acc = '';
    await streamDialogue(state, text, (chunk) => {
      acc += chunk;
      setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, text: acc } : m));
    }).then((response) => {
      const newMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `r-${Date.now()}-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        text: d.text,
      }));
      setMessages(prev => [...prev.filter(m => m.id !== streamingId), ...newMsgs]);
      const next = exchanges + 1;
      setExchanges(next);
      if (next >= 2 || response.newFlags.some(f => f.includes('TRAIL'))) {
        setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 1200);
      }
    }).finally(() => setInputEnabled(true));
  }, [state, dispatch, exchanges]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>The Troupe — Independence Saloon</span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="Address the troupe..." />
    </div>
  );
}
