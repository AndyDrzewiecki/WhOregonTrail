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

    const hiddenSnap = state.hiddenState ?? null;
    const routeType = state.route?.type ?? null;

    const leadershipContext = [
      hiddenSnap?.resentment != null && hiddenSnap.resentment > 50
        ? 'There is real resentment toward the player\'s decisions tonight — someone will say something tonight that they normally would not.'
        : '',
      hiddenSnap?.protection != null && hiddenSnap.protection > 70
        ? 'People feel genuinely protected tonight — there is unusual warmth around this fire.'
        : '',
      hiddenSnap?.boundaryStrain != null && hiddenSnap.boundaryStrain > 50
        ? 'Boundary strain is high — someone will be quiet tonight in a way that says everything.'
        : '',
      hiddenSnap?.obedience != null && hiddenSnap.obedience < 30
        ? 'Obedience is breaking down — not everyone is going to agree with the captain\'s call tonight.'
        : '',
      routeType === 'entertainment_circuit'
        ? 'The entertainment circuit is taking a toll that not everyone signed up for. Someone will name it.'
        : routeType === 'wilderness_route'
          ? 'The wilderness route is isolating. Good and bad — no judgment from outsiders, but no buffer either.'
          : '',
    ].filter(Boolean).join(' ');

    const streamingId = 'camp-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    const recentSummary = state.eventHistory.slice(-3).map(e => e.description).join('; ');
    const campfireSignal = [
      `__CAMPFIRE_START__: Reflect on today. Recent events: ${recentSummary}. Characters should react to SPECIFIC things that happened, not generic trail hardship. If someone died today, someone is grieving. If a conflict went unresolved, someone is still angry. Campfire is where the real feelings come out.`,
      leadershipContext,
    ].filter(Boolean).join(' ');

    streamDialogue(state, campfireSignal, (chunk) => {
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

  const hiddenSnap = state?.hiddenState ?? null;

  const leadershipReflection = (() => {
    const r = hiddenSnap?.resentment ?? 20;
    const p = hiddenSnap?.protection ?? 50;
    const b = hiddenSnap?.boundaryStrain ?? 0;
    if (r > 60) return 'The wagon is still moving. Whether people are with you is a different question.';
    if (p > 70 && b < 30) return 'Tonight, at least, people feel like they are not alone. That is something.';
    if (b > 55) return 'You have been pushing. Some of them know the difference between leadership and extraction.';
    return 'Day done. Nobody died. The fire goes out.';
  })();

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
          <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px' }}>
            {leadershipReflection}
          </p>
          <button className={styles.advanceBtn} onClick={() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' })}>
            Day {state?.day ?? 1} complete. Break camp &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
