/**
 * RHYTHM MECHANIC — Accelerometer or touch-tap rhythm matching.
 *
 * Player performs repeated motions (shakes/taps) at the target BPS.
 * A "beat window" pulses at the target rate. Beats that land in-window
 * are GOOD. Beats outside are counted as misses.
 *
 * Sensors: ACCELEROMETER (motion) or TOUCH (tap on screen).
 * For VOLUME_BUTTON we use a touch fallback (volume buttons aren't
 * accessible via Expo — we simulate with large tap zones).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import type { MechanicProps } from './shared';

const SAMPLE_INTERVAL = 50;

export function RhythmMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const { params, sensor } = config;
  const beatIntervalMs = 1000 / params.target;       // ms between ideal beats
  const windowMs = (params.tolerance / params.target) * 1000;

  const [goodBeats, setGoodBeats] = useState(0);
  const [missedBeats, setMissedBeats] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Math.round(params.durationMs / 1000));
  const [done, setDone] = useState(false);

  const goodRef = useRef(0);
  const missedRef = useRef(0);
  const lastBeatTime = useRef(0);
  const lastPulseTime = useRef(Date.now());
  const minBeats = params.minBeats ?? 10;

  const registerBeat = useCallback(() => {
    const now = Date.now();
    const sinceLastPulse = now - lastPulseTime.current;
    const offset = sinceLastPulse % beatIntervalMs;
    const distanceFromWindow = Math.min(offset, beatIntervalMs - offset);

    if (distanceFromWindow <= windowMs / 2) {
      goodRef.current += 1;
      setGoodBeats(goodRef.current);
    } else {
      missedRef.current += 1;
      setMissedBeats(missedRef.current);
    }

    lastBeatTime.current = now;
    const total = goodRef.current + missedRef.current;
    const pct = Math.round((goodRef.current / Math.max(1, total)) * 100);
    onProgress(pct);
  }, [beatIntervalMs, windowMs, onProgress]);

  const finish = useCallback(() => {
    if (done) return;
    setDone(true);
    Accelerometer.removeAllListeners();

    const totalBeats = goodRef.current + missedRef.current;
    const accuracyScore = totalBeats > 0
      ? (goodRef.current / totalBeats) * 80
      : 0;
    const quantityBonus = goodRef.current >= minBeats ? 20 : (goodRef.current / minBeats) * 20;
    const score = Math.min(100, accuracyScore + quantityBonus);
    onComplete(score);
  }, [done, minBeats, onComplete]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    const timeout = setTimeout(finish, params.durationMs);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pulse visual indicator
  useEffect(() => {
    lastPulseTime.current = Date.now();
    const interval = setInterval(() => {
      lastPulseTime.current = Date.now();
      setPulse(true);
      setTimeout(() => setPulse(false), 80);
    }, beatIntervalMs);
    return () => clearInterval(interval);
  }, [beatIntervalMs]);

  // Accelerometer listener (for ACCELEROMETER and VOLUME_BUTTON sensors)
  useEffect(() => {
    if (sensor !== 'TOUCH') {
      Accelerometer.setUpdateInterval(SAMPLE_INTERVAL);
      let prevMagnitude = 0;
      const sub = Accelerometer.addListener(({ x, y, z }) => {
        const mag = Math.sqrt(x * x + y * y + z * z);
        // Detect peak (previous was rising, now falling)
        if (
          prevMagnitude > params.target - params.tolerance &&
          mag < prevMagnitude &&
          Date.now() - lastBeatTime.current > beatIntervalMs * 0.4
        ) {
          registerBeat();
        }
        prevMagnitude = mag;
      });
      return () => sub.remove();
    }
  }, [sensor, params.target, params.tolerance, beatIntervalMs, registerBeat]);

  const totalBeats = goodBeats + missedBeats;
  const accuracy = totalBeats > 0 ? Math.round((goodBeats / totalBeats) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Pulse indicator */}
      <View style={[styles.pulseRing, pulse && styles.pulseRingActive]} />
      <Text style={styles.bpm}>
        {Math.round(params.target * 60)} BPM target
      </Text>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statGood}>{goodBeats} ✓</Text>
        <Text style={styles.statMiss}>{missedBeats} ✗</Text>
        <Text style={styles.statAcc}>{accuracy}%</Text>
      </View>

      <Text style={styles.timer}>{timeLeft}s</Text>

      {/* Touch tap zone (always shown — fallback for all sensors) */}
      <Pressable
        style={({ pressed }) => [styles.tapZone, pressed && styles.tapZonePressed]}
        onPress={sensor === 'TOUCH' || sensor === 'VOLUME_BUTTON' ? registerBeat : undefined}
      >
        <Text style={styles.tapLabel}>
          {sensor === 'TOUCH' || sensor === 'VOLUME_BUTTON' ? 'TAP' : 'SHAKE'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 8 },
  pulseRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#3a2000',
    marginBottom: 16,
    backgroundColor: '#2a1500',
  },
  pulseRingActive: {
    borderColor: '#c9a96e',
    backgroundColor: '#3a2000',
  },
  bpm: { color: '#8b6914', fontSize: 13, letterSpacing: 2, marginBottom: 16 },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  statGood: { color: '#4caf50', fontSize: 18, fontWeight: 'bold' },
  statMiss: { color: '#f44336', fontSize: 18, fontWeight: 'bold' },
  statAcc: { color: '#f5e6c8', fontSize: 18 },
  timer: { color: '#c9a96e', fontSize: 32, fontWeight: 'bold', marginBottom: 24 },
  tapZone: {
    width: 180,
    height: 80,
    borderWidth: 1,
    borderColor: '#8b6914',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a1500',
  },
  tapZonePressed: {
    backgroundColor: '#3a2500',
    borderColor: '#c9a96e',
  },
  tapLabel: { color: '#f5e6c8', fontSize: 20, letterSpacing: 4 },
});
