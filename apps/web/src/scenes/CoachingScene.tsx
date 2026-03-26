'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction, MemoryEvent } from '@whoreagon-trail/game-engine';
import { streamDialogue, resolveEvent } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

export default function CoachingScene({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [done, setDone] = useState(false);

  const isEntertainment = state?.route?.type === 'entertainment_circuit';
  const headerLabel = isEntertainment ? 'Private — Before the Show' : 'Private — Before the Gate';

  // Identify the coaching target: lowest relationship score to player (most at-risk)
  const coachTarget = (() => {
    if (!state) return null;
    const playerId = state.party[0]?.id;
    const aliveNonPlayer = state.party.filter(m => m.isAlive && m.id !== playerId);
    if (!aliveNonPlayer.length) return null;
    const scores = state.relationshipMatrix[playerId ?? ''] ?? {};
    const sorted = [...aliveNonPlayer].sort((a, b) => (scores[a.id] ?? 50) - (scores[b.id] ?? 50));
    return sorted[0] ?? aliveNonPlayer[0];
  })();

  useEffect(() => {
    if (!state || !coachTarget || messages.length > 0) return;

    const runMemory = state.runMemory;
    const isUsed = runMemory?.usedCharacterIds?.includes(coachTarget.id) ?? false;
    const isProtected = runMemory?.protectedCharacterIds?.includes(coachTarget.id) ?? false;
    const boundaryCrossed = runMemory?.boundaryCrossed ?? false;
    const venueWord = isEntertainment ? 'performance' : 'fort';

    const relationScore = (state.relationshipMatrix[state.party[0]?.id ?? ''] ?? {})[coachTarget.id] ?? 50;
    const temperament = relationScore < 25
      ? 'resentful'
      : relationScore < 40
        ? 'strained'
        : 'uncertain';

    const contextParts = [
      `__PRIVATE_COACHING__: The player has pulled ${coachTarget.name} aside before the upcoming ${venueWord}.`,
      `This is a private moment. ${coachTarget.name} is ${temperament} — give them a realistic response to the player approaching them privately.`,
      `They may be guarded, wary, or cautiously open. One character speaks, not a crowd.`,
      isUsed ? `${coachTarget.name} has been asked to take risks before. They remember.` : null,
      isProtected ? `${coachTarget.name} has been looked out for. They feel some trust.` : null,
      boundaryCrossed ? `A boundary was crossed earlier. ${coachTarget.name} is watching for it to happen again.` : null,
    ].filter(Boolean).join(' ');

    const streamingId = 'coach-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    streamDialogue(state, contextParts, (chunk) => {
      acc += chunk;
      setMessages([{ id: streamingId, text: acc, isStreaming: true }]);
    }, 'TRAIL').then((response) => {
      setMessages(response.dialogue.map((d, i) => ({
        id: `c-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      })));
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'fallback', text: `You find them at the edge of the wagon. They don't look surprised you came. That's either a good sign or a very bad one.`, isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state, coachTarget]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state || !coachTarget || done) return;
    setInputEnabled(false);

    const playerMsg: DisplayMessage = { id: `p-${Date.now()}`, text, isPlayer: true };
    const streamingId = `s-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);

    const response = await resolveEvent(
      state,
      { type: 'coaching_moment', description: `Private pull-aside with ${coachTarget.name} before the ${isEntertainment ? 'performance' : 'fort'}` },
      text,
      'TRAIL'
    );

    const newMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
      id: `r-${Date.now()}-${i}`,
      characterId: d.characterId,
      characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
      voiceTag: d.tone,
      text: d.text,
    }));

    const result = response.eventOutcome.result;

    const closingLine = result === 'success'
      ? `${coachTarget.name} nods. It's not forgiveness. But it's something.`
      : result === 'partial_success'
        ? `${coachTarget.name} doesn't say much. You'll find out what that means soon.`
        : `${coachTarget.name} walks away. You're not sure if you made it better or worse.`;

    setMessages(prev => [
      ...prev.filter(m => m.id !== streamingId),
      ...newMsgs,
      { id: 'closing', text: closingLine, isStreaming: false },
    ]);

    if (result === 'success') {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { resentment: -8, obedience: 5, protection: 5 } });
    } else if (result === 'partial_success') {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { boundaryStrain: -3 } });
    } else {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { resentment: 10, obedience: -5 } });
    }

    dispatch({
      type: 'RECORD_MEMORY_EVENT',
      event: {
        day: state.day,
        type: 'coaching_moment',
        label: `pulled ${coachTarget.name} aside before the ${isEntertainment ? 'performance' : 'fort'}`,
        characterId: coachTarget.id,
        approach: result === 'success' ? 'charm' : result === 'failure' ? 'force' : 'compromise',
        sentiment: result === 'success' ? 'positive' : result === 'failure' ? 'negative' : 'ambiguous',
      } as MemoryEvent,
    });

    dispatch({ type: 'SET_FLAG', flag: `COACHED_DAY_${state.day}` });
    setDone(true);
    setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'FORT' }), 1500);
  }, [state, coachTarget, done, isEntertainment, dispatch]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>{headerLabel}</span>
        {coachTarget && (
          <span style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>
            {coachTarget.name.toUpperCase()}
          </span>
        )}
      </div>
      <DialogueStream messages={messages} />
      <CommandBar
        onSubmit={handleSubmit}
        disabled={!inputEnabled || done}
        placeholder="Say what you need to say. You won't get this chance again."
      />
    </div>
  );
}
