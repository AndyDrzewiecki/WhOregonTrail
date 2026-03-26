/**
 * HoldMechanic
 *
 * Player presses and holds the screen for multiple phases. An oscillating
 * pressure gauge shows whether they're maintaining the right intensity.
 * Haptic pulses keep the rhythm.
 *
 * Double meaning: this is a perfectly normal "hold the brake handle steady"
 * wagon-driving minigame. Obviously.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/src/constants/colors';
import { scoreToTier } from '../MinigameEngine';
import type { MechanicProps } from './shared';

const OSCILLATE_PERIOD_MS = 1200;
const WINDOW_FRACTION = 0.25; // ±25% of oscillation range counts as "in zone"

export default function HoldMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [isPressed, setIsPressed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.durationMs);
  const [holdMs, setHoldMs] = useState(0);
  const [oscillatePos, setOscillatePos] = useState(0); // -1 to 1
  const holdRef = useRef(0);
  const isPressedRef = useRef(false);
  const tickRef = useRef(0);
  const lastHapticRef = useRef(0);
  const [gaugeAnim] = useState(new Animated.Value(0.5));

  const totalDurationMs = config.params?.durationMs ?? config.durationMs;
  const holdPhases = config.params?.holdPhases ?? 3;

  // Oscillating gauge animation
  useEffect(() => {
    if (phase !== 'playing') return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(gaugeAnim, {
          toValue: 1,
          duration: OSCILLATE_PERIOD_MS / 2,
          useNativeDriver: false,
        }),
        Animated.timing(gaugeAnim, {
          toValue: 0,
          duration: OSCILLATE_PERIOD_MS / 2,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase, gaugeAnim]);

  // Sync oscillate pos for in-zone detection
  useEffect(() => {
    const id = setInterval(() => {
      gaugeAnim.stopAnimation((val) => {
        setOscillatePos(val * 2 - 1); // remap 0..1 → -1..1
      });
    }, 50);
    return () => clearInterval(id);
  }, [gaugeAnim]);

  const inZone = Math.abs(oscillatePos) <= WINDOW_FRACTION;

  // Touch handlers via PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isPressedRef.current = true;
        setIsPressed(true);
      },
      onPanResponderRelease: () => {
        isPressedRef.current = false;
        setIsPressed(false);
      },
      onPanResponderTerminate: () => {
        isPressedRef.current = false;
        setIsPressed(false);
      },
    })
  ).current;

  // Game tick
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(() => {
      tickRef.current += 100;

      // Score: credit when pressed AND in-zone
      if (isPressedRef.current && inZone) {
        holdRef.current += 100;
        setHoldMs(holdRef.current);
        const score = Math.min(100, Math.round((holdRef.current / (totalDurationMs / holdPhases)) * 100));
        onProgress?.(score);

        const now = Date.now();
        if (now - lastHapticRef.current > 300) {
          lastHapticRef.current = now;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
      } else if (isPressedRef.current) {
        // Pressed but out of zone — light error buzz occasionally
        const now = Date.now();
        if (now - lastHapticRef.current > 800) {
          lastHapticRef.current = now;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  }, [phase, inZone, totalDurationMs, holdPhases, onProgress]);

  // Result
  useEffect(() => {
    if (phase !== 'result') return;
    const maxScore = totalDurationMs / holdPhases; // credit window per phase
    const score = Math.min(100, Math.round((holdRef.current / maxScore) * 100));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(() => {
      onComplete({ tier: scoreToTier(score), score });
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, totalDurationMs, holdPhases, onComplete]);

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.instructions}>
          {config.taskDescription ?? 'Hold the pressure steady.'}
          {'\n\n'}
          Press and hold when the gauge is in the center zone.
        </Text>
        <View
          {...PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => setPhase('playing'),
          }).panHandlers}
          style={styles.startButton}
        >
          <Text style={styles.startText}>HOLD TO BEGIN</Text>
        </View>
      </View>
    );
  }

  if (phase === 'result') {
    const maxScore = totalDurationMs / holdPhases;
    const score = Math.min(100, Math.round((holdRef.current / maxScore) * 100));
    const tier = scoreToTier(score);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {tier === 'SUCCESS' ? 'HELD STRONG' : tier === 'PARTIAL' ? 'SOME TENSION' : 'SLIPPED'}
        </Text>
        <Text style={styles.resultScore}>{score}%</Text>
      </View>
    );
  }

  const seconds = Math.ceil(timeLeft / 1000);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Text style={styles.hudTimer}>{seconds}s</Text>
      <Text style={styles.instruction}>
        {isPressed ? (inZone ? '✓ HOLD' : 'WAIT...') : 'PRESS'}
      </Text>

      {/* Oscillating gauge */}
      <View style={styles.gaugeContainer}>
        {/* Zone marker */}
        <View style={styles.zoneMarker} />
        {/* Gauge needle */}
        <Animated.View
          style={[
            styles.needle,
            {
              left: gaugeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '95%'],
              }),
              backgroundColor: isPressed && inZone ? COLORS.gold : COLORS.cream,
            },
          ]}
        />
      </View>

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(100, (holdMs / (totalDurationMs / holdPhases)) * 100)}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.label}>
        {isPressed ? 'HOLDING' : 'RELEASE & WAIT'}
      </Text>
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
  instruction: {
    fontSize: 16,
    color: COLORS.cream,
    letterSpacing: 3,
    fontWeight: '600',
  },
  gaugeContainer: {
    width: '100%',
    height: 40,
    backgroundColor: COLORS.darkCard,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    position: 'relative',
    overflow: 'hidden',
  },
  zoneMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: `${(0.5 - WINDOW_FRACTION) * 100}%`,
    width: `${WINDOW_FRACTION * 2 * 100}%`,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },
  needle: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 4,
    borderRadius: 2,
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
  label: {
    color: COLORS.goldDim,
    fontSize: 12,
    letterSpacing: 3,
  },
  resultScore: {
    fontSize: 32,
    color: COLORS.cream,
    fontWeight: '700',
  },
});
