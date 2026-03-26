'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction, EventOutcome } from '@whoreagon-trail/game-engine';
import { getLocationDisplayName } from '@whoreagon-trail/game-engine';
import { resolveEvent, streamDialogue } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

export default function GatekeeperScene({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);

  useEffect(() => {
    if (!state || messages.length > 0) return;
    const streamingId = 'gate-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    streamDialogue(state, '__FORT_ENTRY__', (chunk) => {
      acc += chunk;
      setMessages([{ id: streamingId, text: acc, isStreaming: true }]);
    }).then((response) => {
      setMessages(response.dialogue.map((d, i) => ({
        id: `g-${i}`, characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        text: d.text,
      })));
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: 'A heavyset man in a worn uniform blocks the gate. He looks you up and down.', isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state) return;
    const playerMsg: DisplayMessage = { id: `p-${Date.now()}`, text, isPlayer: true };
    const streamingId = `s-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);
    setInputEnabled(false);
    const response = await resolveEvent(
      state,
      { type: 'fort_arrival', description: `Arriving at ${getLocationDisplayName(state.location)}` },
      text
    );
    const newMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
      id: `r-${Date.now()}-${i}`,
      characterId: d.characterId,
      characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      text: d.text,
    }));
    setMessages(prev => [...prev.filter(m => m.id !== streamingId), ...newMsgs]);
    const outcome: EventOutcome = {
      resourceChanges: response.eventOutcome.resourceChanges,
      healthChanges: response.eventOutcome.healthChanges,
      relationshipDeltas: response.relationshipDeltas,
      newFlags: response.newFlags,
    };
    dispatch({ type: 'APPLY_EVENT_OUTCOME', outcome });
    setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 2500);
    setInputEnabled(false);
  }, [state, dispatch]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>
          {state ? getLocationDisplayName(state.location) : 'Fort'} — Gate
        </span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="What do you say to the gatekeeper..." />
    </div>
  );
}
