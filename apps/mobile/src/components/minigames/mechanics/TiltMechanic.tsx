/**
 * TiltMechanic
 *
 * Player holds their phone at a specific tilt angle for the required duration.
 * Uses the Gyroscope to track rotation. Haptic pulse fires while in-window.
 *
 * Double meaning: "hold your instrument at the right angle" is the setup.
 * The mechanic is holding the phone tilted. That's it.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { Gyroscope } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/src/constants/colors';
import { scoreToTier } from '../MinigameEngine';
import type { MechanicProps } from './shared';

const SENSOR_UNAVAILABLE_AUTO_COMPLETE_MS = 3000;

const TARGET_ANGLE = 0.4;   // radians — moderate tilt
const TOLERANCE = 0.15;      // acceptable window around target
const HAPTIC_INTERVAL_MS = 400;

export default function TiltMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [tiltY, setTiltY] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.durationMs);
  const [holdMs, setHoldMs] = useState(0);
  const [sensorUnavailable, setSensorUnavailable] = useState(false);
  const holdRef = useRef(0);
  const lastHapticRef = useRef(0);
  const subRef = useRef<ReturnType<typeof Gyroscope.addListener> | null>(null);

  const targetAngle = config.params?.target ?? TARGET_ANGLE;
  const tolerance = config.params?.tolerance ?? TOLERANCE;
  const totalDurationMs = config.params?.durationMs ?? config.durationMs;

  const inWindow = Math.abs(tiltY - targetAngle) <= tolerance;

  // Detect sensor availability on mount
  useEffect(() => {
    let cancelled = false;
    Gyroscope.isAvailableAsync().then((available) => {
      if (!cancelled && !available) {
        setSensorUnavailable(true);
      }
    }).catch(() => {
      if (!cancelled) setSensorUnavailable(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-complete at PARTIAL after 3s when sensor is unavailable and playing
  useEffect(() => {
    if (!sensorUnavailable || phase !== 'playing') return;
    const timer = setTimeout(() => {
      // PARTIAL tier: score of 50
      onComplete({ tier: 'PARTIAL', score: 50 });
    }, SENSOR_UNAVAILABLE_AUTO_COMPLETE_MS);
    return () => clearTimeout(timer);
  }, [sensorUnavailable, phase, onComplete]);

  // Subscribe to gyroscope
  useEffect(() => {
    if (phase !== 'playing') return;
    if (sensorUnavailable) return;

    Gyroscope.setUpdateInterval(100);
    subRef.current = Gyroscope.addListener(({ y }) => {
      setTiltY((prev) => {
        // Simple low-pass filter to smooth noise
        return prev * 0.7 + y * 0.3;
      });
    });

    return () => {
      subRef.current?.remove();
    };
  }, [phase, sensorUnavailable]);

  // Haptic pulse when in-window
  const handleHaptic = useCallback(() => {
    const now = Date.now();
    if (inWindow && now - lastHapticRef.current > HAPTIC_INTERVAL_MS) {
      lastHapticRef.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
  }, [inWindow]);

  // Game tick
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(() => {
      handleHaptic();

      setTimeLeft((prev) => {
        const next = prev - 100;
        if (next <= 0) {
          setPhase('result');
          return 0;
        }
        return next;
      });

      if (inWindow) {
        setHoldMs((prev) => {
          holdRef.current = prev + 100;
          const score = Math.min(100, Math.round((holdRef.current / totalDurationMs) * 100));
          onProgress?.(score);
          return holdRef.current;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, inWindow, totalDurationMs, onProgress, handleHaptic]);

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
          {config.taskDescription ?? 'Hold the angle.'}
          {'\n\n'}
          Tilt your phone and hold it steady in the marked zone.
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
          {tier === 'SUCCESS' ? 'HELD IT' : tier === 'PARTIAL' ? 'CLOSE ENOUGH' : 'SLIPPED'}
        </Text>
        <Text style={styles.resultScore}>
          {(holdRef.current / 1000).toFixed(1)}s in zone
        </Text>
      </View>
    );
  }

  // Sensor-unavailable fallback: show countdown message while auto-completing
  if (sensorUnavailable && phase === 'playing') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.instructions}>
          Tilt unavailable on this device.{'\n\n'}
          Completing automatically in a moment...
        </Text>
      </View>
    );
  }

  const seconds = Math.ceil(timeLeft / 1000);
  const barFill = Math.min(100, (holdMs / totalDurationMs) * 100);
  const indicatorPos = ((tiltY + 1) / 2) * 100; // map -1..1 to 0..100%
  const zoneMin = ((targetAngle - tolerance + 1) / 2) * 100;
  const zoneMax = ((targetAngle + tolerance + 1) / 2) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.hudTimer}>{seconds}s</Text>

      {/* Tilt bar */}
      <View style={styles.barContainer}>
        {/* Target zone */}
        <View
          style={[
            styles.targetZone,
            {
              left: `${Math.max(0, zoneMin)}%`,
              width: `${Math.min(100, zoneMax) - Math.max(0, zoneMin)}%`,
            },
          ]}
        />
        {/* Current tilt indicator */}
        <View
          style={[
            styles.indicator,
            {
              left: `${Math.max(0, Math.min(98, indicatorPos))}%`,
              backgroundColor: inWindow ? COLORS.gold : COLORS.cream,
            },
          ]}
        />
      </View>

      <Text style={styles.label}>
        {inWindow ? '✓ IN ZONE' : 'TILT TO TARGET'}
      </Text>

      {/* Hold progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${barFill}%` }]} />
      </View>
      <Text style={styles.holdLabel}>
        {(holdMs / 1000).toFixed(1)}s held
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
  barContainer: {
    width: '100%',
    height: 40,
    backgroundColor: COLORS.darkCard,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 24,
  },
  targetZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(201,168,76,0.2)',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: COLORS.cream,
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
  holdLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  resultScore: {
    fontSize: 22,
    color: COLORS.cream,
    fontWeight: '700',
  },
});
