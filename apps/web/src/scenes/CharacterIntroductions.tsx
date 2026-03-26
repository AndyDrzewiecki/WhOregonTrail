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
    streamDialogue(state, '__PARTY_ASSEMBLE__: The player has just agreed to lead this troupe west. Introduce 3-4 characters with distinct first impressions. Make at least one immediately likeable, one immediately suspicious, and one immediately funny. Do not introduce everyone at once.', (chunk) => {
      accumulated += chunk;
      setMessages([{ id: streamingId, text: accumulated, isStreaming: true }]);
    }).then((response) => {
      const display: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `intro-msg-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      }));
      setMessages(display);
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: 'Delphine lights a cheroot without looking up. Someone in the back is arguing about a mule. You have approximately forty-five seconds before this becomes your problem.', isStreaming: false }]);
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
        voiceTag: d.tone,
        text: d.text,
      }));
      setMessages(prev => [...prev.filter(m => m.id !== streamingId), ...newMsgs]);
      const next = exchanges + 1;
      setExchanges(next);
      if (next >= 2 || response.newFlags.some(f => f.includes('TRAIL'))) {
        const transitionId = `transition-${Date.now()}`;
        setTimeout(() => {
          setMessages(prev => [...prev, { id: transitionId, text: 'The wagon rolls west.', isStreaming: false }]);
        }, 400);
        setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 1400);
      }
    }).finally(() => setInputEnabled(true));
  }, [state, dispatch, exchanges]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>The Troupe — Independence Saloon</span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="They need to hear it from you." />
    </div>
  );
}
