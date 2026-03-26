/**
 * BalanceMechanic
 *
 * Player keeps their phone perfectly still. A bubble in a level indicator
 * drifts based on gyroscope input. Score is time spent inside the target circle.
 *
 * Double meaning: "hold still while we get the angle right" — perfectly
 * appropriate frontier surveying instruction.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Gyroscope } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/src/constants/colors';
import { scoreToTier } from '../MinigameEngine';
import type { MechanicProps } from './shared';

const BUBBLE_DECAY = 0.85;    // how quickly the bubble drifts back when still
const SENSITIVITY = 40;       // pixels per radian/s
const CENTER_RADIUS = 30;     // px — target zone radius
const HAPTIC_INTERVAL_MS = 500;

export default function BalanceMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [bubbleX, setBubbleX] = useState(0);
  const [bubbleY, setBubbleY] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.durationMs);
  const [holdMs, setHoldMs] = useState(0);
  const holdRef = useRef(0);
  const lastHapticRef = useRef(0);
  const bubbleXRef = useRef(0);
  const bubbleYRef = useRef(0);
  const subRef = useRef<ReturnType<typeof Gyroscope.addListener> | null>(null);

  const totalDurationMs = config.params?.durationMs ?? config.durationMs;

  // Subscribe gyroscope
  useEffect(() => {
    if (phase !== 'playing') return;

    Gyroscope.setUpdateInterval(100);
    subRef.current = Gyroscope.addListener(({ x, z }) => {
      // x rotation → vertical bubble movement, z rotation → horizontal
      bubbleXRef.current = (bubbleXRef.current + z * SENSITIVITY) * BUBBLE_DECAY;
      bubbleYRef.current = (bubbleYRef.current + x * SENSITIVITY) * BUBBLE_DECAY;

      // Clamp bubble to container
      const maxOffset = 80;
      bubbleXRef.current = Math.max(-maxOffset, Math.min(maxOffset, bubbleXRef.current));
      bubbleYRef.current = Math.max(-maxOffset, Math.min(maxOffset, bubbleYRef.current));

      setBubbleX(bubbleXRef.current);
      setBubbleY(bubbleYRef.current);
    });

    return () => {
      subRef.current?.remove();
    };
  }, [phase]);

  // Game tick
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(() => {
      const dist = Math.sqrt(
        bubbleXRef.current * bubbleXRef.current +
        bubbleYRef.current * bubbleYRef.current
      );
      const inZone = dist <= CENTER_RADIUS;

      if (inZone) {
        holdRef.current += 100;
        setHoldMs(holdRef.current);
        const score = Math.min(100, Math.round((holdRef.current / totalDurationMs) * 100));
        onProgress?.(score);

        const now = Date.now();
        if (now - lastHapticRef.current > HAPTIC_INTERVAL_MS) {
          lastHapticRef.current = now;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
      }

      setTimeLeft((prev) => {
        const next = prev - 100;
        if (next <= 0) {
          setPhase('result');
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, totalDurationMs, onProgress]);

  // Result
  useEffect(() => {
    if (phase !== 'result') return;
    const score = Math.min(100, Math.round((holdRef.current / totalDurationMs) * 100));
    const timer = setTimeout(() => {
      onComplete({ tier: scoreToTier(score), score });
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, totalDurationMs, onComplete]);

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.instructions}>
          {config.taskDescription ?? 'Keep the bubble centered.'}
          {'\n\n'}
          Hold your phone perfectly level.
        </Text>
        <Pressable style={styles.startButton} onPress={() => setPhase('playing')}>
          <Text style={styles.startText}>BEGIN</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'result') {
    const score = Math.min(100, Math.round((holdRef.current / totalDurationMs) * 100));
    const tier = scoreToTier(score);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {tier === 'SUCCESS' ? 'STEADY HAND' : tier === 'PARTIAL' ? 'NEARLY THERE' : 'SHAKY WORK'}
        </Text>
        <Text style={styles.resultScore}>
          {(holdRef.current / 1000).toFixed(1)}s balanced
        </Text>
      </View>
    );
  }

  const seconds = Math.ceil(timeLeft / 1000);
  const dist = Math.sqrt(bubbleX * bubbleX + bubbleY * bubbleY);
  const inZone = dist <= CENTER_RADIUS;

  return (
    <View style={styles.container}>
      <Text style={styles.hudTimer}>{seconds}s</Text>

      {/* Level indicator */}
      <View style={styles.levelContainer}>
        {/* Target zone */}
        <View style={styles.targetCircle} />
        {/* Bubble */}
        <View
          style={[
            styles.bubble,
            {
              transform: [
                { translateX: bubbleX },
                { translateY: bubbleY },
              ],
              backgroundColor: inZone ? COLORS.gold : COLORS.cream,
            },
          ]}
        />
      </View>

      <Text style={styles.label}>
        {inZone ? '✓ LEVEL' : 'KEEP STILL'}
      </Text>

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${Math.min(100, (holdMs / totalDurationMs) * 100)}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 3,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 22,
  },
  startButton: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 2,
    marginTop: 16,
  },
  startText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
  },
  hudTimer: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gold,
    position: 'absolute',
    top: 32,
  },
  levelContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.goldDim,
    backgroundColor: COLORS.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  targetCircle: {
    position: 'absolute',
    width: CENTER_RADIUS * 2,
    height: CENTER_RADIUS * 2,
    borderRadius: CENTER_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  bubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: 'absolute',
  },
  label: {
    color: COLORS.goldDim,
    fontSize: 13,
    letterSpacing: 3,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.darkCard,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.goldDim,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.gold,
  },
  resultScore: {
    fontSize: 22,
    color: COLORS.cream,
    fontWeight: '700',
  },
});
