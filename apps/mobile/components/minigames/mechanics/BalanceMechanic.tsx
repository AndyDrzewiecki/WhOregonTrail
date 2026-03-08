/**
 * BALANCE MECHANIC — Gyroscope stillness requirement.
 *
 * Player must keep the phone perfectly level (rotation rate near zero).
 * A visual "bubble level" shows current tilt.
 * Optional: final "release" phase (sharp tilt to complete).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import type { MechanicProps } from './shared';

const SAMPLE_INTERVAL = 33; // ~30fps

export function BalanceMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const { params } = config;

  const [rotationRate, setRotationRate] = useState({ x: 0, y: 0 });
  const [holdMs, setHoldMs] = useState(0);
  const [phase, setPhase] = useState<'hold' | 'release'>('hold');
  const [done, setDone] = useState(false);

  const holdRef = useRef(0);
  const requiredHoldMs = params.durationMs * 0.65; // 65% of total time in tolerance

  const finish = useCallback(
    (score: number) => {
      if (done) return;
      setDone(true);
      Gyroscope.removeAllListeners();
      onComplete(score);
    },
    [done, onComplete]
  );

  useEffect(() => {
    Gyroscope.setUpdateInterval(SAMPLE_INTERVAL);

    const sub = Gyroscope.addListener(({ x, y }) => {
      setRotationRate({ x, y });

      if (phase !== 'hold') return;

      const totalRate = Math.sqrt(x * x + y * y);
      const inTolerance = totalRate <= params.tolerance;

      if (inTolerance) {
        holdRef.current = Math.min(requiredHoldMs, holdRef.current + SAMPLE_INTERVAL);
      } else {
        holdRef.current = Math.max(0, holdRef.current - SAMPLE_INTERVAL * 1.5);
      }

      setHoldMs(holdRef.current);
      onProgress(Math.round((holdRef.current / requiredHoldMs) * 100));

      if (holdRef.current >= requiredHoldMs) {
        setPhase('release');
      }
    });

    const timeout = setTimeout(() => {
      const score = Math.round((holdRef.current / requiredHoldMs) * 80);
      finish(score);
    }, params.durationMs);

    return () => {
      sub.remove();
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRelease() {
    if (phase === 'release') {
      finish(100);
    }
  }

  // Bubble position from rotation rate
  const bubbleX = Math.max(-40, Math.min(40, rotationRate.y * -80));
  const bubbleY = Math.max(-40, Math.min(40, rotationRate.x * 80));
  const holdProgress = Math.min(100, Math.round((holdMs / requiredHoldMs) * 100));

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {phase === 'hold' ? 'Keep it perfectly level' : 'NOW — release!'}
      </Text>

      {/* Bubble level */}
      <View style={styles.levelOuter}>
        <View style={styles.levelInner}>
          {/* Target zone */}
          <View style={styles.targetZone} />
          {/* Bubble */}
          <View
            style={[
              styles.bubble,
              {
                transform: [
                  { translateX: bubbleX },
                  { translateY: bubbleY },
                ],
                backgroundColor:
                  phase === 'hold' && holdProgress > 80
                    ? '#4caf50'
                    : '#c9a96e',
              },
            ]}
          />
        </View>
      </View>

      {/* Hold progress bar */}
      <View style={styles.holdTrack}>
        <View style={[styles.holdFill, { width: `${holdProgress}%` }]} />
      </View>
      <Text style={styles.holdLabel}>{holdProgress}%</Text>

      {/* Release button — only active after hold complete */}
      {phase === 'release' && (
        <Pressable style={styles.releaseButton} onPress={handleRelease}>
          <Text style={styles.releaseLabel}>RELEASE</Text>
        </Pressable>
      )}
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
  levelOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#8b6914',
    backgroundColor: '#2a1500',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  levelInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetZone: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8b6914',
    opacity: 0.5,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#c9a96e',
  },
  holdTrack: {
    width: 240,
    height: 12,
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#8b6914',
    marginBottom: 8,
  },
  holdFill: {
    height: '100%',
    backgroundColor: '#c9a96e',
  },
  holdLabel: { color: '#c9a96e', fontSize: 14, marginBottom: 24 },
  releaseButton: {
    borderWidth: 2,
    borderColor: '#f5e6c8',
    paddingHorizontal: 48,
    paddingVertical: 20,
    backgroundColor: '#3a2000',
  },
  releaseLabel: {
    color: '#f5e6c8',
    fontSize: 22,
    letterSpacing: 4,
    fontWeight: 'bold',
  },
});
