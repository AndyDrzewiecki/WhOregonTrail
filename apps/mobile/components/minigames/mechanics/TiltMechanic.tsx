/**
 * TILT MECHANIC — Gyroscope-driven angle control.
 *
 * Uses expo-sensors Gyroscope for rotation rate.
 * Visual: a vertical bar rising from bottom, fill = current angle.
 *
 * Multi-phase: player must hold target angle at each threshold.
 * Uses React Native Skia for the progress arc.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import type { MechanicProps } from './shared';

const SAMPLE_INTERVAL = 50; // ms

export function TiltMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const { params } = config;
  const phaseCount = params.holdPhases ?? 1;
  const phaseDuration = params.durationMs / phaseCount;
  const phaseTargets = Array.from(
    { length: phaseCount },
    (_, i) => (params.target / phaseCount) * (i + 1)
  );

  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseHoldMs, setPhaseHoldMs] = useState(0);
  const [done, setDone] = useState(false);

  const angleRef = useRef(0);
  const phaseRef = useRef(0);
  const holdRef = useRef(0);
  const phasesCompleted = useRef(0);
  const startTime = useRef(Date.now());

  const phaseTarget = phaseTargets[currentPhase] ?? params.target;
  const requiredHoldMs = phaseDuration * 0.5; // must hold target for 50% of phase duration

  const finish = useCallback(
    (completed: number) => {
      if (done) return;
      setDone(true);
      Gyroscope.removeAllListeners();
      const score = Math.round((completed / phaseCount) * 100);
      onComplete(score);
    },
    [done, phaseCount, onComplete]
  );

  useEffect(() => {
    Gyroscope.setUpdateInterval(SAMPLE_INTERVAL);

    const sub = Gyroscope.addListener(({ x }) => {
      // Integrate rotation rate → angle (crude integration)
      angleRef.current = Math.max(
        0,
        Math.min(params.target + 20, angleRef.current + Math.abs(x) * (SAMPLE_INTERVAL / 1000) * 40)
      );
      setCurrentAngle(angleRef.current);

      const target = phaseTargets[phaseRef.current] ?? params.target;
      const inTolerance =
        Math.abs(angleRef.current - target) <= params.tolerance;

      if (inTolerance) {
        holdRef.current += SAMPLE_INTERVAL;
        setPhaseHoldMs(holdRef.current);

        const progress = Math.round(
          ((phaseRef.current + holdRef.current / requiredHoldMs) / phaseCount) * 100
        );
        onProgress(Math.min(100, progress));

        if (holdRef.current >= requiredHoldMs) {
          phasesCompleted.current += 1;
          if (phaseRef.current + 1 >= phaseCount) {
            finish(phaseCount);
          } else {
            phaseRef.current += 1;
            setCurrentPhase(phaseRef.current);
            holdRef.current = 0;
            setPhaseHoldMs(0);
          }
        }
      } else {
        // Penalty for drifting out of tolerance
        holdRef.current = Math.max(0, holdRef.current - SAMPLE_INTERVAL * 0.5);
        setPhaseHoldMs(holdRef.current);
      }
    });

    // Time limit
    const timeout = setTimeout(() => {
      finish(phasesCompleted.current);
    }, params.durationMs + 500);

    return () => {
      sub.remove();
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const barHeight = Math.min(100, (currentAngle / params.target) * 100);
  const holdProgress = Math.min(100, (phaseHoldMs / requiredHoldMs) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.phase}>
        Phase {currentPhase + 1} of {phaseCount}
      </Text>
      <Text style={styles.instruction}>
        Tilt to {Math.round(phaseTarget)}° and hold
      </Text>

      {/* Angle bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: `${barHeight}%` }]} />
        {/* Target line */}
        <View
          style={[
            styles.targetLine,
            {
              bottom: `${Math.min(100, (phaseTarget / params.target) * 100)}%`,
            },
          ]}
        />
      </View>

      {/* Hold ring */}
      <Text style={styles.holdLabel}>Hold: {Math.round(holdProgress)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 16 },
  phase: { color: '#8b6914', fontSize: 13, letterSpacing: 2, marginBottom: 4 },
  instruction: { color: '#f5e6c8', fontSize: 16, marginBottom: 24 },
  barTrack: {
    width: 60,
    height: 280,
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#8b6914',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#c9a96e',
    position: 'absolute',
    bottom: 0,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#f5e6c8',
    opacity: 0.9,
  },
  holdLabel: { color: '#c9a96e', fontSize: 14, marginTop: 16 },
});
