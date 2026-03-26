'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction, EventOutcome } from '@whoreagon-trail/game-engine';
import { resolveEvent, streamDialogue } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

export default function ConflictScene({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);

  useEffect(() => {
    if (!state || messages.length > 0) return;
    const lastEvent = state.eventHistory[state.eventHistory.length - 1];
    if (!lastEvent) { dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }); return; }
    const streamingId = 'conflict-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    streamDialogue(state, `__EVENT__:${lastEvent.type}`, (chunk) => {
      acc += chunk;
      setMessages([{ id: streamingId, text: acc, isStreaming: true }]);
    }).then((response) => {
      setMessages(response.dialogue.map((d, i) => ({
        id: `c-${i}`, characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        text: d.text,
      })));
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: 'Tension fills the wagon. Everyone waits for you to act.', isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state) return;
    const lastEvent = state.eventHistory[state.eventHistory.length - 1];
    const playerMsg: DisplayMessage = { id: `p-${Date.now()}`, text, isPlayer: true };
    const streamingId = `s-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);
    setInputEnabled(false);
    const trailEvent = lastEvent
      ? { type: lastEvent.type, description: lastEvent.description }
      : { type: 'hostile_encounter', description: 'A hostile encounter on the trail.' };
    const response = await resolveEvent(state, trailEvent, text);
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
    setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 2000);
    setInputEnabled(false);
  }, [state, dispatch]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>Trail Event</span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="How do you handle this..." />
    </div>
  );
}
