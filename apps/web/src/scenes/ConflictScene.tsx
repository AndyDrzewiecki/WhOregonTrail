'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction, EventOutcome, MemoryEvent } from '@whoreagon-trail/game-engine';
import { resolveEvent, streamDialogue } from '@whoreagon-trail/ai-client';
import { buildSpotlightSignal } from '@/lib/spotlightUtils';
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

    const resentment = state.hiddenState?.resentment ?? 10;
    const boundaryStrain = state.hiddenState?.boundaryStrain ?? 0;
    const routeType = state.route?.type ?? null;

    const economyContext = resentment > 50
      ? `Internal resentment is HIGH — this conflict has a history behind it, not just this event.`
      : boundaryStrain > 40
        ? `Boundary strain is elevated — someone in the wagon has been pushed past their comfort and this is related.`
        : routeType === 'entertainment_circuit'
          ? `The entertainment circuit route is straining the troupe. This conflict is partly about the choices being made.`
          : '';

    const routeChainSignal = routeType === 'wilderness_route'
      ? `On the wilderness route, there is no outside pressure to hold this together. If it breaks here, it breaks alone.`
      : routeType === 'entertainment_circuit'
        ? `The entertainment circuit is creating this conflict. Both characters know it. The argument is about the decisions that led here.`
        : '';

    // Build callback signal from run memory
    const callbackSignal = (() => {
      const memory = state.runMemory;
      if (!memory || memory.events.length === 0) return '';

      const lastConflict = [...memory.events].reverse().find(e => e.type === 'conflict_outcome');
      const lastGatekeeper = [...memory.events].reverse().find(e => e.type === 'gatekeeper_outcome');

      if (lastConflict?.sentiment === 'negative') {
        return `A previous conflict was not resolved well. Characters in this scene remember it. One of them may reference that unfinished business.`;
      }
      if (lastConflict?.sentiment === 'positive') {
        return `The captain has successfully mediated before. One character may defer to that track record, at least at first.`;
      }
      if (lastGatekeeper?.sentiment === 'negative') {
        return `The wagon was turned away from a fort recently. That humiliation is still fresh. This conflict is partly about that.`;
      }
      return '';
    })();

    const conflictSignal = [
      `__CONFLICT__: An internal party conflict is in progress. Event that triggered it: ${lastEvent.type}. ${lastEvent.description}. Two characters are visibly in conflict. Show both sides. Do not resolve it yet. Let the player walk into the middle of it.`,
      economyContext,
      routeChainSignal,
      callbackSignal,
      buildSpotlightSignal(state),
    ].filter(Boolean).join(' ');

    const streamingId = 'conflict-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    streamDialogue(state, conflictSignal, (chunk) => {
      acc += chunk;
      setMessages([{ id: streamingId, text: acc, isStreaming: true }]);
    }, 'CONFLICT_MEDIATOR').then((response) => {
      setMessages(response.dialogue.map((d, i) => ({
        id: `c-${i}`, characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      })));
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: 'You walk in to find Mama Szabo holding a ladle like a weapon and Reverend Cain looking like he is reconsidering his entire theology. Neither of them stops when they see you. That is, in your experience, a bad sign.', isStreaming: false }]);
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
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { resentment: -10, obedience: 5 } });
    } else if (result === 'partial_success') {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { resentment: 5, boundaryStrain: 5 } });
    } else {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { resentment: 15, obedience: -10 } });
    }

    dispatch({
      type: 'RECORD_MEMORY_EVENT',
      event: {
        day: state.day,
        type: 'conflict_outcome',
        label: result === 'success'
          ? 'resolved internal conflict — wagon held together'
          : result === 'partial_success'
            ? 'patched over a conflict — tension remains'
            : 'conflict went unresolved — fracture deepened',
        approach: result === 'success' ? 'compromise' : result === 'failure' ? 'force' : 'manipulation',
        sentiment: result === 'success' ? 'positive' : result === 'failure' ? 'negative' : 'ambiguous',
      } as MemoryEvent,
    });

    setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 2000);
    setInputEnabled(false);
  }, [state, dispatch]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>Trail Event</span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="Step in. Or don't. Both choices cost something." />
    </div>
  );
}
