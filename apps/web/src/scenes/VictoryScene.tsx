'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import { computeScore, getEpilogue } from '@whoreagon-trail/game-engine';
import type { RunScore } from '@whoreagon-trail/game-engine';
import { characterStable } from '@whoreagon-trail/characters';
import { generateEpilogue } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

// ── Component ─────────────────────────────────────────────────────────────────

export default function VictoryScene({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [arrivalDone, setArrivalDone] = useState(false);
  const fetchStarted = useRef(false);

  const score = state ? computeScore(state) : null;
  const epilogue = state && score ? getEpilogue(state, score) : '';

  // Fetch the AI arrival narrative once
  useEffect(() => {
    if (!state || fetchStarted.current) return;
    fetchStarted.current = true;

    // Dispatch END so storage is cleared and state reflects run complete
    dispatch({ type: 'SET_PHASE', phase: 'END' });

    const loadingId = 'arrival-loading';
    setMessages([{ id: loadingId, text: 'Oregon City. The wagon rolls in.', isStreaming: true }]);

    const fallbackTimer = setTimeout(() => {
      const alive = state.party.filter(m => m.isAlive);
      setMessages([{
        id: 'arrival-fallback',
        text: `Oregon City. Day ${state.day}. The wagon rolls through the gate and stops. There is no ceremony. There is no announcement. ${alive.length} people get out. That is the number that matters. Delphine Marchais looks at the city and then looks at you. She does not say anything. She does not have to.`,
        isStreaming: false,
      }]);
      setArrivalDone(true);
    }, 14_000);

    generateEpilogue(state).then((response) => {
      clearTimeout(fallbackTimer);
      // Show the outcome description as the arrival narrative, then character dialogue
      const outcomeText = response.eventOutcome?.description ?? '';
      const dialogueMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `arr-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: (d as { tone?: string }).tone,
        text: d.text,
        isStreaming: false,
      }));
      const allMsgs: DisplayMessage[] = outcomeText
        ? [{ id: 'arr-outcome', text: outcomeText, isStreaming: false }, ...dialogueMsgs]
        : dialogueMsgs;
      setMessages(allMsgs.length > 0 ? allMsgs : [{
        id: 'arr-fallback',
        text: `Oregon City. Day ${state.day}. ${state.party.filter(m => m.isAlive).length} people step out. The trail is over.`,
        isStreaming: false,
      }]);
      setArrivalDone(true);
    }).catch(() => {
      clearTimeout(fallbackTimer);
      setMessages([{
        id: 'arr-error',
        text: `Oregon City. Day ${state.day}. The wagon stops. ${state.party.filter(m => m.isAlive).length} people step out. Delphine looks at the city and then at you. The trail is over.`,
        isStreaming: false,
      }]);
      setArrivalDone(true);
    });

    return () => clearTimeout(fallbackTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayAgain = useCallback(() => {
    dispatch({ type: 'START_RUN', party: characterStable });
  }, [dispatch]);

  if (!state || !score) return null;

  const alive = state.party.filter(m => m.isAlive);
  const dead = state.party.filter(m => !m.isAlive);

  const gradeColor: Record<string, string> = {
    S: '#ffd700',
    A: '#c9a227',
    B: '#a8896c',
    C: 'var(--muted)',
    D: 'var(--error)',
  };

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>Oregon City — End of Trail</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          Day {state.day} &bull; {alive.length}/{state.party.length} survived
        </span>
      </div>

      {/* Arrival narrative */}
      <div style={{ paddingTop: '52px' }}>
        <DialogueStream messages={messages} />
      </div>

      {/* Epilogue + score — shown after AI narration completes */}
      {arrivalDone && (
        <div style={{ padding: '0 clamp(16px,5vw,48px) 80px' }}>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--gold-dim)', margin: '24px 0' }} />

          {/* Score card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '24px',
            alignItems: 'start',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ScoreLine label="Survival" value={`${alive.length} / ${state.party.length}`} />
              <ScoreLine label="Resources" value={`${score.resourceScore}/100`} />
              <ScoreLine label="Protection" value={`${score.protectionScore}/100`} />
              <ScoreLine label="Resentment" value={`${score.resentmentPenalty}/100`} dimmed />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: gradeColor[score.grade] ?? 'var(--gold)', lineHeight: 1 }}>
                {score.grade}
              </div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginTop: '4px' }}>
                {score.final} / 100
              </div>
            </div>
          </div>

          {/* Casualty list */}
          {dead.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: '6px' }}>
                DID NOT ARRIVE
              </div>
              {dead.map(m => (
                <div key={m.id} style={{ fontSize: '0.8rem', color: 'var(--muted)', opacity: 0.6, fontStyle: 'italic', marginBottom: '2px' }}>
                  {m.name}
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--gold-dim)', margin: '24px 0' }} />

          {/* Epilogue */}
          {epilogue && (
            <div style={{ marginBottom: '28px' }}>
              {epilogue.split('\n\n').map((para, i) => (
                <p key={i} style={{
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  color: 'var(--muted)',
                  lineHeight: 1.7,
                  margin: i > 0 ? '12px 0 0' : '0',
                }}>
                  {para}
                </p>
              ))}
            </div>
          )}

          {/* Play again */}
          <button className={styles.advanceBtn} onClick={handlePlayAgain}>
            Run it again &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function ScoreLine({ label, value, dimmed }: { label: string; value: string; dimmed?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', letterSpacing: '0.1em', minWidth: '90px' }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: '0.85rem', color: dimmed ? 'var(--muted)' : 'var(--cream)', opacity: dimmed ? 0.6 : 1, fontFamily: 'var(--font-mono)' }}>
        {value}
      </span>
    </div>
  );
}
