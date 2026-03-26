'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import { characterStable } from '@whoreagon-trail/characters';
import { streamDialogue } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

export default function WagonOpener({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);

  useEffect(() => {
    if (!state && !started) {
      dispatch({ type: 'START_RUN', party: characterStable });
      setStarted(true);
    }
  }, [state, started, dispatch]);

  useEffect(() => {
    if (!state || messages.length > 0) return;
    const streamingId = 'narrator-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let accumulated = '';
    streamDialogue(state, '__SCENE_START__', (chunk: string) => {
      accumulated += chunk;
      setMessages([{ id: streamingId, text: accumulated, isStreaming: true }]);
    }).then((response) => {
      const display: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `msg-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      }));
      setMessages(display);
      setInputEnabled(true);
      if (response.newFlags.includes('PROLOGUE_COMPLETE')) {
        dispatch({ type: 'SET_FLAG', flag: 'PROLOGUE_COMPLETE' });
      }
    }).catch(() => {
      setMessages([{ id: 'err', text: 'You were born in a small village in Moravia. You were not supposed to end up here. Delphine Marchais has been staring at you since you walked in.', isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state) return;
    const playerMsg: DisplayMessage = { id: `player-${Date.now()}`, text, isPlayer: true };
    const streamingId = `streaming-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);
    setInputEnabled(false);
    let accumulated = '';
    await streamDialogue(state, text, (chunk: string) => {
      accumulated += chunk;
      setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, text: accumulated } : m));
    }).then((response) => {
      const newMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `resp-${Date.now()}-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      }));
      setMessages(prev => [...prev.filter(m => m.id !== streamingId), ...newMsgs]);
      if (response.newFlags.includes('PROLOGUE_COMPLETE')) {
        dispatch({ type: 'SET_FLAG', flag: 'PROLOGUE_COMPLETE' });
      }
    }).finally(() => setInputEnabled(true));
  }, [state, dispatch]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>The Blue Moon Saloon — Independence, Missouri — April 1848</span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="Say something. They're all looking at you." />
    </div>
  );
}
