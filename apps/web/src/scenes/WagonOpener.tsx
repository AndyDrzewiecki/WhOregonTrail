'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import { characterStable } from '@whoreagon-trail/characters';
import { streamDialogue } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

// Cold open text — shown before AI loads. Establishes premise without AI dependency.
const COLD_OPEN_LINES = [
  { id: 'co-1', text: 'Independence, Missouri. April 1848. The Oregon Trail opens in six weeks.' },
  { id: 'co-2', text: 'You have been hired to lead a wagon west. The wagon belongs to Delphine Marchais.' },
  { id: 'co-3', text: "Delphine's troupe performs. They also do other work. Frontier men pay for both." },
  { id: 'co-4', text: 'Twelve people. One wagon. Two thousand miles. No guarantee anyone arrives.' },
  { id: 'co-5', text: 'Delphine is looking at you. She wants to know what kind of captain you are.' },
  { id: 'co-6', text: 'So does everyone else in this saloon.' },
];

export default function WagonOpener({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [coldOpenDone, setColdOpenDone] = useState(false);

  // Dispatch START_RUN immediately
  useEffect(() => {
    if (!state && !started) {
      dispatch({ type: 'START_RUN', party: characterStable });
      setStarted(true);
    }
  }, [state, started, dispatch]);

  // Show cold open lines with stagger, then start AI stream
  useEffect(() => {
    if (coldOpenDone || messages.length > 0) return;

    // Show cold open with 350ms stagger per line
    const timers: ReturnType<typeof setTimeout>[] = [];
    COLD_OPEN_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setMessages(prev => [...prev, { ...line, isStreaming: false }]);
      }, i * 350));
    });
    // Mark cold open done after all lines shown
    timers.push(setTimeout(() => setColdOpenDone(true), COLD_OPEN_LINES.length * 350 + 200));

    return () => timers.forEach(clearTimeout);
  }, [coldOpenDone, messages.length]);

  // Start AI stream once state is ready and cold open is done
  useEffect(() => {
    if (!state || !coldOpenDone) return;
    // Check we haven't already started streaming (no streaming message exists)
    if (messages.some(m => m.isStreaming)) return;

    const streamingId = 'narrator-ai';
    setMessages(prev => [...prev, { id: streamingId, text: '', isStreaming: true }]);
    let accumulated = '';

    streamDialogue(
      state,
      '__SCENE_START__: The player has just walked into the Blue Moon Saloon in Independence. They have agreed to lead this troupe west. Delphine Marchais is sizing them up. React to the player\'s presence. Give Delphine one line and one other character one line. Do not explain the premise — they are already in it.',
      (chunk: string) => {
        accumulated += chunk;
        setMessages(prev => prev.map(m =>
          m.id === streamingId ? { ...m, text: accumulated } : m
        ));
      }
    ).then((response) => {
      const aiMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `ai-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      }));
      setMessages(prev => [...prev.filter(m => m.id !== streamingId), ...aiMsgs]);
      setInputEnabled(true);
      if (response.newFlags.includes('PROLOGUE_COMPLETE')) {
        dispatch({ type: 'SET_FLAG', flag: 'PROLOGUE_COMPLETE' });
      }
    }).catch(() => {
      setMessages(prev => prev.filter(m => m.id !== streamingId));
      setMessages(prev => [...prev, {
        id: 'fallback',
        text: 'Delphine Marchais has been watching you since you walked in. She has the look of someone who has already decided something about you. She is waiting to find out if she is right.',
        isStreaming: false,
      }]);
      setInputEnabled(true);
    });
  }, [state, coldOpenDone]);

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
      <CommandBar
        onSubmit={handleSubmit}
        disabled={!inputEnabled}
        placeholder="Say something. They're all looking at you."
      />
    </div>
  );
}
