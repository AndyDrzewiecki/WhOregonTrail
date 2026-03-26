'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
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

const AI_TIMEOUT_MS = 15_000;

export default function WagonOpener({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [coldOpenDone, setColdOpenDone] = useState(false);

  // Refs prevent stale-closure bugs in effects that run once
  const streamStarted = useRef(false);
  const coldOpenStarted = useRef(false);

  // Dispatch START_RUN once when there is no saved game state
  useEffect(() => {
    if (!state && !started) {
      dispatch({ type: 'START_RUN', party: characterStable });
      setStarted(true);
    }
  }, [state, started, dispatch]);

  // FIX: cold open effect must NOT have messages.length in dep array.
  // Previously: dep array included messages.length, so every timer firing
  // (which adds a message) re-ran the effect and the cleanup canceled the
  // remaining timers — only the first cold-open line ever showed and
  // setColdOpenDone(true) was never called, blocking the AI stream forever.
  useEffect(() => {
    if (coldOpenStarted.current) return;
    coldOpenStarted.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];
    COLD_OPEN_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setMessages(prev => [...prev, { ...line, isStreaming: false }]);
      }, i * 350));
    });
    timers.push(setTimeout(() => setColdOpenDone(true), COLD_OPEN_LINES.length * 350 + 200));

    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start AI stream once state is ready and cold open is done.
  // FIX: use streamStarted ref instead of messages.some() — messages is stale
  // inside this effect closure (not in dep array) so the old check was unreliable.
  useEffect(() => {
    if (!state || !coldOpenDone) return;
    if (streamStarted.current) return;
    streamStarted.current = true;

    const streamingId = 'narrator-ai';
    setMessages(prev => [...prev, { id: streamingId, text: '', isStreaming: true }]);
    let accumulated = '';

    const timeoutId = setTimeout(() => {
      // If AI hasn't responded in AI_TIMEOUT_MS, surface fallback and unblock input
      setMessages(prev => [
        ...prev.filter(m => m.id !== streamingId),
        {
          id: 'fallback',
          text: 'Delphine Marchais has been watching you since you walked in. She has the look of someone who has already decided something about you. She is waiting to find out if she is right.',
          isStreaming: false,
        },
      ]);
      setInputEnabled(true);
    }, AI_TIMEOUT_MS);

    streamDialogue(
      state,
      "__SCENE_START__: The player has just walked into the Blue Moon Saloon in Independence. They have agreed to lead this troupe west. Delphine Marchais is sizing them up. React to the player's presence. Give Delphine one line and one other character one line. Do not explain the premise — they are already in it.",
      (chunk: string) => {
        accumulated += chunk;
        setMessages(prev => prev.map(m =>
          m.id === streamingId ? { ...m, text: accumulated } : m
        ));
      }
    ).then((response) => {
      clearTimeout(timeoutId);
      const aiMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `ai-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      }));
      setMessages(prev => [...prev.filter(m => m.id !== streamingId), ...aiMsgs]);
      setInputEnabled(true);
    }).catch(() => {
      clearTimeout(timeoutId);
      setMessages(prev => prev.filter(m => m.id !== streamingId));
      setMessages(prev => [...prev, {
        id: 'fallback',
        text: 'Delphine Marchais has been watching you since you walked in. She has the look of someone who has already decided something about you. She is waiting to find out if she is right.',
        isStreaming: false,
      }]);
      setInputEnabled(true);
    });
  }, [state, coldOpenDone, dispatch]);

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
    }).catch(() => {
      setMessages(prev => prev.filter(m => m.id !== streamingId));
    }).finally(() => {
      // FIX: always dispatch PROLOGUE_COMPLETE after the first player interaction
      // so the scene reliably advances regardless of AI flag response.
      dispatch({ type: 'SET_FLAG', flag: 'PROLOGUE_COMPLETE' });
      setInputEnabled(true);
    });
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
