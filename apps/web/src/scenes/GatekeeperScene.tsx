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
  const [negotiating, setNegotiating] = useState(false);

  useEffect(() => {
    if (!state || messages.length > 0) return;

    const routeType = state.route?.type ?? 'fort_route';
    const stigma = state.hiddenState?.stigmaPressure ?? 20;

    const gatekeeperContext = [
      `__FORT_ENTRY__`,
      `Route: ${routeType.replace(/_/g, ' ')}.`,
      stigma > 60
        ? `Stigma pressure level: HIGH — rumors have preceded the troupe.`
        : stigma > 35
          ? `Stigma pressure level: MODERATE — word is traveling.`
          : `Stigma pressure level: LOW — relatively unknown here.`,
      `The gatekeeper should reflect this. High stigma means they know exactly what this wagon is and have already decided something about it.`,
      `Low stigma means they are suspicious but not certain. Give them specific body language and a specific concern.`,
    ].join(' ');

    const streamingId = 'gate-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    streamDialogue(state, gatekeeperContext, (chunk) => {
      acc += chunk;
      setMessages([{ id: streamingId, text: acc, isStreaming: true }]);
    }, 'FORT_GATEKEEPER').then((response) => {
      setMessages(response.dialogue.map((d, i) => ({
        id: `g-${i}`, characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      })));
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: 'A man built like a grain warehouse blocks the gate. He has the look of someone who has said no to a lot of people and enjoyed every time. He looks at Delphine. Then at you. Then back at Delphine.', isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state) return;
    const playerMsg: DisplayMessage = { id: `p-${Date.now()}`, text, isPlayer: true };
    const streamingId = `s-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);
    setInputEnabled(false);
    setNegotiating(true);
    const response = await resolveEvent(
      state,
      { type: 'fort_arrival', description: `Arriving at ${getLocationDisplayName(state.location)}` },
      text,
      'FORT_GATEKEEPER'
    );
    const newMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
      id: `r-${Date.now()}-${i}`,
      characterId: d.characterId,
      characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      voiceTag: d.tone,
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

    const result = response.eventOutcome.result;
    if (result === 'failure') {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { stigmaPressure: 10, resentment: 5 } });
    } else {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { stigmaPressure: -5, protection: 5 } });
    }

    setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 2500);
    setInputEnabled(false);
  }, [state, dispatch]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>
          {state ? getLocationDisplayName(state.location) : 'Fort'} — Gate
        </span>
        <span style={{ fontSize: '0.65rem', color: negotiating ? 'var(--gold)' : 'var(--error)', letterSpacing: '0.1em' }}>
          {negotiating ? 'ENTRY GRANTED' : 'ENTRY DENIED'}
        </span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="Pick your words carefully." />
    </div>
  );
}
