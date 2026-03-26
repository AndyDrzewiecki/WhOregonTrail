'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

type TargetState = 'growing' | 'inZone' | 'miss' | 'hit';

export default function MinigameInterruption({ state, dispatch }: Props) {
  const lastEventType = state?.eventHistory[state.eventHistory.length - 1]?.type;
  const isHunting = lastEventType === 'hunting_opportunity';
  const minigameTitle = isHunting ? 'Hunting Break' : 'Performance Opportunity';
  const minigameInstruction = isHunting
    ? 'Click each target as it enters the sweet zone. Food depends on your timing.'
    : 'The crowd is watching. Hit your marks.';

  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [targetScale, setTargetScale] = useState(0.3);
  const [targetState, setTargetState] = useState<TargetState>('growing');
  const [showYield, setShowYield] = useState(false);
  const [tier, setTier] = useState<'SUCCESS' | 'PARTIAL' | 'FAILURE' | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const CYCLE_MS = 800;
  const rounds = 6;
  const roundRef = useRef(0);

  const runRound = useCallback(() => {
    if (roundRef.current >= rounds) {
      const pct = (score / rounds) * 100;
      const t: 'SUCCESS' | 'PARTIAL' | 'FAILURE' = pct >= 70 ? 'SUCCESS' : pct >= 35 ? 'PARTIAL' : 'FAILURE';
      setTier(t);
      setPhase('result');
      return;
    }
    setTargetState('growing');
    startTimeRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / CYCLE_MS, 1);
      const s = 0.3 + progress * 0.9;
      setTargetScale(s);
      const inZone = s >= 0.6 * 1.2 && s <= 0.95 * 1.2;
      setTargetState(inZone ? 'inZone' : 'growing');
      if (progress < 1) { animFrameRef.current = requestAnimationFrame(animate); }
      else {
        setTargetState('miss');
        roundRef.current += 1;
        setTotal(roundRef.current);
        setTimeout(runRound, 300);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [score, rounds]);

  const handleClick = useCallback(() => {
    if (phase !== 'playing') return;
    cancelAnimationFrame(animFrameRef.current);
    const isHit = targetState === 'inZone';
    setTargetState(isHit ? 'hit' : 'miss');
    if (isHit) setScore(s => s + 1);
    roundRef.current += 1;
    setTotal(roundRef.current);
    setTimeout(runRound, 300);
  }, [phase, targetState, runRound]);

  const start = () => {
    roundRef.current = 0;
    setScore(0);
    setTotal(0);
    setPhase('playing');
    setTimeout(() => setShowYield(true), 5000);
    runRound();
  };

  useEffect(() => () => cancelAnimationFrame(animFrameRef.current), []);

  const finish = useCallback((finalTier: 'SUCCESS' | 'PARTIAL' | 'FAILURE') => {
    const reward = finalTier === 'SUCCESS' ? 60 : finalTier === 'PARTIAL' ? 30 : 0;
    if (reward > 0) dispatch({ type: 'UPDATE_RESOURCES', changes: { money: reward } });
    dispatch({ type: 'SET_PHASE', phase: 'TRAIL' });
  }, [dispatch]);

  return (
    <div className={styles.minigameOverlay}>
      {phase === 'ready' && (
        <>
          <p className={styles.minigameTitle}>{minigameTitle}</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{minigameInstruction}</p>
          <button className={styles.advanceBtn} onClick={start}>Begin &rarr;</button>
        </>
      )}
      {phase === 'playing' && (
        <>
          <p className={styles.miniScore}>{score}/{total} hits</p>
          <div className={styles.targetZone} onClick={handleClick}>
            <div className={`${styles.target} ${targetState === 'inZone' ? styles.inZone : ''}`}
              style={{ transform: `scale(${targetScale})`, transition: 'border-color 100ms' }} />
          </div>
          <button className={`${styles.yieldBtn} ${showYield ? styles.visible : ''}`}
            onClick={() => { cancelAnimationFrame(animFrameRef.current); setTier('FAILURE'); setPhase('result'); }}>
            Yield
          </button>
        </>
      )}
      {phase === 'result' && tier && (
        <>
          <p className={styles.minigameTitle}>
            {tier === 'SUCCESS'
              ? 'The Crowd Goes Wild — $60 earned'
              : tier === 'PARTIAL'
                ? 'Polite Applause — $30 earned'
                : isHunting
                  ? 'Missed Clean — no food earned'
                  : 'The Crowd Turns — no earnings'}
          </p>
          <button className={styles.advanceBtn} onClick={() => finish(tier)}>Continue &rarr;</button>
        </>
      )}
    </div>
  );
}
