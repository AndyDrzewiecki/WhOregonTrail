'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

type TargetState = 'growing' | 'inZone' | 'miss' | 'hit';
type GamePhase = 'ready' | 'playing' | 'result';

// Escalating difficulty per round
const ROUND_CONFIG = [
  { cycleMs: 800, zoneMin: 0.55, zoneMax: 0.90 },  // round 1
  { cycleMs: 800, zoneMin: 0.55, zoneMax: 0.90 },  // round 2
  { cycleMs: 620, zoneMin: 0.60, zoneMax: 0.88 },  // round 3
  { cycleMs: 620, zoneMin: 0.60, zoneMax: 0.88 },  // round 4
  { cycleMs: 460, zoneMin: 0.65, zoneMax: 0.85 },  // round 5
  { cycleMs: 460, zoneMin: 0.65, zoneMax: 0.85 },  // round 6
] as const;
const TOTAL_ROUNDS = ROUND_CONFIG.length;

export default function MinigameInterruption({ state, dispatch }: Props) {
  const lastEventType = state?.eventHistory[state.eventHistory.length - 1]?.type;
  const isHunting = lastEventType === 'hunting_opportunity' || lastEventType === 'hunting';
  const title = isHunting ? 'Hunting Break' : 'Performance Opportunity';
  const instruction = isHunting
    ? 'Click when the target enters the golden zone. Timing earns food.'
    : 'Hit your marks. The crowd remembers everything.';

  const [gamePhase, setGamePhase] = useState<GamePhase>('ready');
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [targetScale, setTargetScale] = useState(0.3);
  const [targetState, setTargetState] = useState<TargetState>('growing');
  const [feedback, setFeedback] = useState<'hit' | 'miss' | null>(null);
  const [showYield, setShowYield] = useState(false);
  const [tier, setTier] = useState<'SUCCESS' | 'PARTIAL' | 'FAILURE' | null>(null);
  const [huntingPos, setHuntingPos] = useState(50); // % left position for hunting variant

  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const roundRef = useRef(0);
  const scoreRef = useRef(0);
  // Keep a ref to targetState so handleClick never reads stale closure value
  const targetStateRef = useRef<TargetState>('growing');

  // Sync ref whenever state updates
  useEffect(() => {
    targetStateRef.current = targetState;
  }, [targetState]);

  const showFeedback = useCallback((type: 'hit' | 'miss') => {
    setFeedback(type);
    setTimeout(() => setFeedback(null), 400);
  }, []);

  const endGame = useCallback(() => {
    const pct = (scoreRef.current / TOTAL_ROUNDS) * 100;
    const t: 'SUCCESS' | 'PARTIAL' | 'FAILURE' =
      pct >= 67 ? 'SUCCESS' : pct >= 33 ? 'PARTIAL' : 'FAILURE';
    setTier(t);
    setGamePhase('result');
  }, []);

  const runRound = useCallback(() => {
    if (roundRef.current >= TOTAL_ROUNDS) { endGame(); return; }

    const config = ROUND_CONFIG[roundRef.current];
    setCurrentRound(roundRef.current + 1);
    setTargetState('growing');
    targetStateRef.current = 'growing';

    // Hunting: randomize horizontal position
    if (isHunting) {
      setHuntingPos(15 + Math.random() * 70);
    }

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / config.cycleMs, 1);
      const s = 0.25 + progress * 0.85;
      setTargetScale(s);
      const inZone = s >= config.zoneMin && s <= config.zoneMax;
      const newState: TargetState = inZone ? 'inZone' : 'growing';
      setTargetState(newState);
      targetStateRef.current = newState;
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setTargetState('miss');
        targetStateRef.current = 'miss';
        showFeedback('miss');
        roundRef.current += 1;
        setTimeout(runRound, 500);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [isHunting, endGame, showFeedback]);

  const handleClick = useCallback(() => {
    if (gamePhase !== 'playing') return;
    cancelAnimationFrame(animFrameRef.current);
    const isHit = targetStateRef.current === 'inZone';
    const nextState: TargetState = isHit ? 'hit' : 'miss';
    setTargetState(nextState);
    targetStateRef.current = nextState;
    showFeedback(isHit ? 'hit' : 'miss');
    if (isHit) {
      scoreRef.current += 1;
      setScore(s => s + 1);
    }
    roundRef.current += 1;
    setTimeout(runRound, 500);
  }, [gamePhase, runRound, showFeedback]);

  const start = useCallback(() => {
    roundRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setCurrentRound(0);
    setGamePhase('playing');
    setTimeout(() => setShowYield(true), 5000);
    runRound();
  }, [runRound]);

  useEffect(() => () => cancelAnimationFrame(animFrameRef.current), []);

  const finish = useCallback((finalTier: 'SUCCESS' | 'PARTIAL' | 'FAILURE') => {
    if (isHunting) {
      const food = finalTier === 'SUCCESS' ? 35 : finalTier === 'PARTIAL' ? 15 : 0;
      if (food > 0) dispatch({ type: 'UPDATE_RESOURCES', changes: { food } });
    } else {
      const money = finalTier === 'SUCCESS' ? 60 : finalTier === 'PARTIAL' ? 30 : 0;
      if (money > 0) dispatch({ type: 'UPDATE_RESOURCES', changes: { money } });
    }
    dispatch({ type: 'SET_PHASE', phase: 'TRAIL' });
  }, [dispatch, isHunting]);

  // Difficulty label
  const difficultyLabel = currentRound <= 2 ? '' : currentRound <= 4 ? ' — HARDER' : ' — FAST';

  return (
    <div className={styles.minigameOverlay}>
      {gamePhase === 'ready' && (
        <>
          <p className={styles.minigameTitle}>{title}</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center', maxWidth: '280px' }}>
            {instruction}
          </p>
          <p style={{ color: 'var(--gold-dim)', fontSize: '0.7rem', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
            {TOTAL_ROUNDS} ROUNDS — ESCALATES
          </p>
          <button className={styles.advanceBtn} onClick={start}>Begin &rarr;</button>
        </>
      )}

      {gamePhase === 'playing' && (
        <>
          <p className={styles.miniScore}>
            Round {currentRound}/{TOTAL_ROUNDS}{difficultyLabel} &nbsp;·&nbsp; {score} hits
          </p>

          {/* Feedback flash */}
          {feedback && (
            <p style={{
              color: feedback === 'hit' ? 'var(--gold)' : 'var(--error)',
              fontSize: '1.2rem',
              height: '24px',
              fontFamily: 'var(--font-mono)',
              transition: 'opacity 200ms',
            }}>
              {feedback === 'hit' ? '✓' : '×'}
            </p>
          )}
          {!feedback && <p style={{ height: '24px' }} />}

          <div
            className={styles.targetZone}
            onClick={handleClick}
            style={isHunting ? { position: 'relative' } : undefined}
          >
            <div
              className={`${styles.target} ${targetState === 'inZone' ? styles.inZone : ''}`}
              style={{
                transition: 'border-color 80ms',
                ...(isHunting ? {
                  position: 'absolute',
                  top: '50%',
                  left: `${huntingPos}%`,
                  transform: `translate(-50%, -50%) scale(${targetScale})`,
                } : {
                  transform: `scale(${targetScale})`,
                }),
              }}
            />
          </div>

          <button
            className={`${styles.yieldBtn} ${showYield ? styles.visible : ''}`}
            onClick={() => {
              cancelAnimationFrame(animFrameRef.current);
              setTier('FAILURE');
              setGamePhase('result');
            }}
          >
            Yield
          </button>
        </>
      )}

      {gamePhase === 'result' && tier && (
        <>
          <p className={styles.minigameTitle}>
            {tier === 'SUCCESS'
              ? (isHunting ? `Clean Shot — ${score}/${TOTAL_ROUNDS} hits — 35 lbs food` : `The Crowd Goes Wild — $60 earned`)
              : tier === 'PARTIAL'
                ? (isHunting ? `Some Meat — ${score}/${TOTAL_ROUNDS} hits — 15 lbs food` : `Polite Applause — $30 earned`)
                : (isHunting ? 'Missed Clean — nothing' : 'The Crowd Turns — no earnings')}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
            {score}/{TOTAL_ROUNDS} rounds hit
          </p>
          <button className={styles.advanceBtn} onClick={() => finish(tier)}>Continue &rarr;</button>
        </>
      )}
    </div>
  );
}
