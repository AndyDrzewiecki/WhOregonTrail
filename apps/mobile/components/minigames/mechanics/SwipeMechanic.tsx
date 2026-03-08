/**
 * SWIPE MECHANIC — Directed swipe sequence.
 *
 * Player performs swipes in the required sequence (left/right/up/down).
 * Used for: grease-the-axle (repeated left-right coverage passes).
 * Visual: shows the current direction cue and a coverage meter.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import type { MechanicProps } from './shared';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
const ARROW: Record<Direction, string> = {
  UP: '↑', DOWN: '↓', LEFT: '←', RIGHT: '→',
};
const SWIPE_THRESHOLD = 30; // px minimum for a registered swipe

export function SwipeMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const { params } = config;
  const sequence = (params.swipeSequence ?? ['LEFT', 'RIGHT']) as Direction[];

  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'good' | 'bad'>('none');
  const [timeLeft, setTimeLeft] = useState(Math.round(params.durationMs / 1000));
  const [done, setDone] = useState(false);

  const stepRef = useRef(0);
  const completedRef = useRef(0);
  const touchStart = useRef({ x: 0, y: 0 });

  const finish = useCallback(() => {
    if (done) return;
    setDone(true);
    const score = Math.round((completedRef.current / sequence.length) * 100);
    onComplete(score);
  }, [done, sequence.length, onComplete]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(countdown); finish(); return 0; }
        return t - 1;
      });
    }, 1000);
    const timeout = setTimeout(finish, params.durationMs);
    return () => { clearInterval(countdown); clearTimeout(timeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function detectDirection(dx: number, dy: number): Direction | null {
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return null;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'RIGHT' : 'LEFT';
    }
    return dy > 0 ? 'DOWN' : 'UP';
  }

  function handleSwipe(dir: Direction) {
    const expected = sequence[stepRef.current];
    if (dir === expected) {
      completedRef.current += 1;
      setCompleted(completedRef.current);
      setFeedback('good');
      onProgress(Math.round((completedRef.current / sequence.length) * 100));

      if (stepRef.current + 1 >= sequence.length) {
        finish();
        return;
      }
      stepRef.current += 1;
      setStepIndex(stepRef.current);
    } else {
      setFeedback('bad');
    }
    setTimeout(() => setFeedback('none'), 200);
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      touchStart.current = {
        x: e.nativeEvent.pageX,
        y: e.nativeEvent.pageY,
      };
    },
    onPanResponderRelease: (e) => {
      const dx = e.nativeEvent.pageX - touchStart.current.x;
      const dy = e.nativeEvent.pageY - touchStart.current.y;
      const dir = detectDirection(dx, dy);
      if (dir) handleSwipe(dir);
    },
  });

  const currentExpected = sequence[stepIndex] as Direction;
  const progress = Math.round((completed / sequence.length) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Swipe {currentExpected?.toLowerCase()} — {sequence.length - completed} remaining
      </Text>

      {/* Swipe zone */}
      <View
        style={[
          styles.swipeZone,
          feedback === 'good' && styles.swipeGood,
          feedback === 'bad' && styles.swipeBad,
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.arrow}>
          {currentExpected ? ARROW[currentExpected] : '✓'}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.timerLabel}>{timeLeft}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 8 },
  instruction: {
    color: '#f5e6c8',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  swipeZone: {
    width: 240,
    height: 240,
    borderWidth: 1,
    borderColor: '#8b6914',
    backgroundColor: '#2a1500',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  swipeGood: { borderColor: '#4caf50', backgroundColor: '#1a2a00' },
  swipeBad: { borderColor: '#f44336', backgroundColor: '#2a0000' },
  arrow: { fontSize: 80, color: '#c9a96e' },
  progressTrack: {
    width: 240,
    height: 8,
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#8b6914',
    marginBottom: 12,
  },
  progressFill: { height: '100%', backgroundColor: '#c9a96e' },
  timerLabel: { color: '#8b6914', fontSize: 20 },
});
