'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction, EventOutcome } from '@whoreagon-trail/game-engine';
import { getLocationDisplayName } from '@whoreagon-trail/game-engine';
import { resolveEvent, streamDialogue } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

export default function EntertainmentCircuitScene({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!state || messages.length > 0) return;

    const { indebtedness, boundaryStrain, obedience } = state.hiddenState;
    const signal = [
      `__ENTERTAINMENT_CIRCUIT__: A local promoter approaches. They've heard about the troupe and want a performance. They have money and an audience. They also have expectations. The troupe is watching you negotiate. What you agree to will matter.`,
      indebtedness > 40
        ? `The wagon is in debt. Some in the troupe will feel they have no real choice.`
        : null,
      boundaryStrain > 40
        ? `Boundary strain is already elevated. Someone has been pushed. Another push tonight will break something.`
        : null,
      obedience < 40
        ? `Obedience is low. Not everyone will do what you agree to without being asked directly.`
        : null,
    ].filter(Boolean).join(' ');

    const streamingId = 'ec-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    streamDialogue(state, signal, (chunk) => {
      acc += chunk;
      setMessages([{ id: streamingId, text: acc, isStreaming: true }]);
    }, 'FORT').then((response) => {
      setMessages(response.dialogue.map((d, i) => ({
        id: `ec-${i}`, characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      })));
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: `The promoter has a smile that's been worn on too many faces before yours. The troupe is quiet. Everyone is waiting to see what kind of captain you are.`, isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state) return;
    const playerMsg: DisplayMessage = { id: `p-${Date.now()}`, text, isPlayer: true };
    const streamingId = `s-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);
    setInputEnabled(false);
    setResolved(true);

    const response = await resolveEvent(
      state,
      { type: 'performance_opportunity', description: `Performance negotiation at ${getLocationDisplayName(state.location)}` },
      text,
      'FORT'
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
    if (result === 'success') {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { protection: 5, indebtedness: -10, resentment: -5 } });
    } else if (result === 'partial_success') {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { boundaryStrain: 10, indebtedness: -5 } });
    } else {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { resentment: 15, boundaryStrain: 15, stigmaPressure: 5 } });
    }

    setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'CAMPFIRE' }), 2000);
  }, [state, dispatch]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>
          {state ? getLocationDisplayName(state.location) : 'Fort'} — Entertainment Circuit
        </span>
        <span style={{ fontSize: '0.65rem', color: resolved ? 'var(--gold)' : 'var(--muted)', letterSpacing: '0.1em' }}>
          {resolved ? 'NEGOTIATED' : 'PERFORMANCE NEGOTIATION'}
        </span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="Your terms. Or theirs." />
    </div>
  );
}
