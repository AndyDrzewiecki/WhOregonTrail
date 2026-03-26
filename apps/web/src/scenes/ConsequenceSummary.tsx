'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import { streamDialogue } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

export default function ConsequenceSummary({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [exchanges, setExchanges] = useState(0);
  const MAX = 3;

  useEffect(() => {
    if (!state || messages.length > 0) return;
    dispatch({ type: 'SET_PHASE', phase: 'CAMPFIRE' });
    const streamingId = 'camp-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    const recentSummary = state.eventHistory.slice(-3).map(e => e.description).join('; ');
    streamDialogue(state, `__CAMPFIRE_START__: Reflect on today. Recent events: ${recentSummary}. Characters should react to SPECIFIC things that happened, not generic trail hardship. If someone died today, someone is grieving. If a conflict went unresolved, someone is still angry. Campfire is where the real feelings come out.`, (chunk) => {
      acc += chunk;
      setMessages([{ id: streamingId, text: acc, isStreaming: true }]);
    }, 'CAMPFIRE').then((response) => {
      setMessages(response.dialogue.map((d, i) => ({
        id: `camp-${i}`, characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      })));
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: 'The fire burns low. Delphine is cleaning her boots. Someone is crying quietly at the edge of the firelight. Nobody asks who.', isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state, dispatch]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state || exchanges >= MAX) return;
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
      if (next >= MAX) {
        setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 1500);
      } else {
        setInputEnabled(true);
      }
    });
  }, [state, dispatch, exchanges]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>Campfire — Night Camp</span>
      </div>
      <DialogueStream messages={messages} />
      {exchanges < MAX && (
        <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="The fire's going. Say what needs saying." />
      )}
      {exchanges >= MAX && (
        <div style={{ padding: '16px clamp(16px,5vw,48px)', textAlign: 'center' }}>
          <button className={styles.advanceBtn} onClick={() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' })}>
            Day {state?.day ?? 1} complete. Break camp &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
