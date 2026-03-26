/**
 * RhythmMechanic
 *
 * Player taps a button in time with a pulsing beat indicator.
 * Score is based on timing accuracy across the required number of beats.
 * Haptic feedback fires on each tap.
 *
 * Double meaning: "keep the beat" is innocent; what they're keeping time FOR
 * is left entirely to imagination.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/src/constants/colors';
import { scoreToTier } from '../MinigameEngine';
import type { MechanicProps } from './shared';

const BEAT_INTERVAL_MS = 600; // BPM ~100
const WINDOW_MS = 200;         // ±200ms counts as on-beat

export default function RhythmMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [beatCount, setBeatCount] = useState(0);
  const [hits, setHits] = useState(0);
  const [lastBeatTime, setLastBeatTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [timeLeft, setTimeLeft] = useState(config.durationMs);
  const beatRef = useRef(0);
  const startTimeRef = useRef(0);
  const minBeats = config.params?.minBeats ?? 12;

  // Pulse animation on each beat
  const triggerPulse = useCallback(() => {
    pulseAnim.setValue(1.4);
    Animated.spring(pulseAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  }, [pulseAnim]);

  // Beat metronome
  useEffect(() => {
    if (phase !== 'playing') return;

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      beatRef.current = now;
      setLastBeatTime(now);
      setBeatCount((n) => n + 1);
      triggerPulse();
    }, BEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [phase, triggerPulse]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(() => {
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
  }, [phase]);

  // Report result when done
  useEffect(() => {
    if (phase !== 'result') return;
    const score = Math.min(100, Math.round((hits / minBeats) * 100));
    onProgress?.(score);
    const timer = setTimeout(() => {
      onComplete({ tier: scoreToTier(score), score });
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, hits, minBeats, onComplete, onProgress]);

  const handleTap = useCallback(() => {
    if (phase !== 'playing') return;
    const now = Date.now();
    const nearest = beatRef.current;
    const diff = Math.abs(now - nearest);

    if (diff <= WINDOW_MS) {
      setHits((h) => {
        const next = h + 1;
        onProgress?.(Math.min(100, Math.round((next / minBeats) * 100)));
        return next;
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [phase, minBeats, onProgress]);

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.instructions}>
          {config.taskDescription ?? 'Keep the beat.'}
          {'\n\n'}
          Tap in time with the pulse.
        </Text>
        <Pressable style={styles.startButton} onPress={() => setPhase('playing')}>
          <Text style={styles.startText}>BEGIN</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'result') {
    const score = Math.min(100, Math.round((hits / minBeats) * 100));
    const tier = scoreToTier(score);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {tier === 'SUCCESS' ? 'PERFECT RHYTHM' : tier === 'PARTIAL' ? 'DECENT BEAT' : 'LOST THE TEMPO'}
        </Text>
        <Text style={styles.resultScore}>{hits} / {minBeats} beats</Text>
      </View>
    );
  }

  const seconds = Math.ceil(timeLeft / 1000);

  return (
    <View style={styles.container}>
      <Text style={styles.hudTimer}>{seconds}s</Text>
      <Text style={styles.beatCount}>Beat {beatCount}</Text>

      <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />

      <Pressable style={styles.tapButton} onPress={handleTap}>
        <Text style={styles.tapLabel}>TAP</Text>
      </Pressable>

      <Text style={styles.hitsText}>{hits} on-beat</Text>
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
  beatCount: {
    fontSize: 12,
    color: COLORS.goldDim,
    letterSpacing: 2,
    position: 'absolute',
    top: 72,
  },
  pulseRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.gold,
    marginBottom: 16,
  },
  tapButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.darkCard,
    borderWidth: 2,
    borderColor: COLORS.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  tapLabel: {
    color: COLORS.cream,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
  },
  hitsText: {
    fontSize: 14,
    color: COLORS.muted,
    position: 'absolute',
    bottom: 60,
  },
  resultScore: {
    fontSize: 22,
    color: COLORS.cream,
    fontWeight: '700',
  },
});
