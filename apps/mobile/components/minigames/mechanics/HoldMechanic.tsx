/**
 * HOLD MECHANIC — Two-finger pressure hold in a target zone.
 *
 * Player touches the screen and must maintain pressure (approximated
 * by keeping two fingers within bounds) while the mechanic drifts.
 * A pressure gauge oscillates — player must track it.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import type { MechanicProps } from './shared';

export function HoldMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const { params } = config;

  // Pressure oscillates between 0–100 on a sine wave
  // Player "holds" by keeping their touch active — the pressure meter
  // drifts with noise; releasing drops it instantly
  const [pressure, setPressure] = useState(50);
  const [isHolding, setIsHolding] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.round(params.durationMs / 1000));
  const [done, setDone] = useState(false);

  const scoreRef = useRef(0);
  const holdingRef = useRef(false);
  const tickRef = useRef(0);

  const finish = useCallback(() => {
    if (done) return;
    setDone(true);
    onComplete(scoreRef.current);
  }, [done, onComplete]);

  // Pressure oscillation loop
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;

      // Sine wave with noise — target drifts
      const sineValue =
        params.target +
        Math.sin((tickRef.current * Math.PI) / 20) * 25 +
        (Math.random() - 0.5) * 8;

      const clamped = Math.max(0, Math.min(100, sineValue));
      setPressure(clamped);

      // Score if holding AND in tolerance
      if (holdingRef.current) {
        const distance = Math.abs(clamped - params.target);
        if (distance <= params.tolerance) {
          scoreRef.current = Math.min(100, scoreRef.current + 1.5);
        } else {
          scoreRef.current = Math.max(0, scoreRef.current - 0.5);
        }
        setScore(Math.round(scoreRef.current));
        onProgress(Math.round(scoreRef.current));
      } else {
        scoreRef.current = Math.max(0, scoreRef.current - 2);
        setScore(Math.round(scoreRef.current));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [params.target, params.tolerance, onProgress]);

  // Countdown
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

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { holdingRef.current = true; setIsHolding(true); },
    onPanResponderRelease: () => { holdingRef.current = false; setIsHolding(false); },
    onPanResponderTerminate: () => { holdingRef.current = false; setIsHolding(false); },
  });

  const inZone = Math.abs(pressure - params.target) <= params.tolerance;
  const gaugeY = (1 - pressure / 100) * 240;
  const targetY = (1 - params.target / 100) * 240;
  const topEdge = (1 - (params.target + params.tolerance) / 100) * 240;
  const zoneHeight = (params.tolerance * 2 / 100) * 240;

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {isHolding ? (inZone ? 'Perfect — hold it' : 'Adjust...') : 'Touch and hold'}
      </Text>

      {/* Gauge */}
      <View style={styles.gaugeTrack} {...panResponder.panHandlers}>
        {/* Target zone */}
        <View
          style={[
            styles.targetZone,
            { top: topEdge, height: zoneHeight },
          ]}
        />
        {/* Pressure indicator */}
        <View
          style={[
            styles.pressureBar,
            {
              top: Math.max(0, gaugeY - 6),
              backgroundColor: inZone ? '#4caf50' : '#c9a96e',
            },
          ]}
        />
        {/* Target line */}
        <View style={[styles.targetLine, { top: targetY }]} />

        <Text style={styles.gaugeLabel}>HOLD</Text>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.scoreLabel}>{score}</Text>
        <Text style={styles.timerLabel}>{timeLeft}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 8 },
  instruction: {
    color: '#f5e6c8',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  gaugeTrack: {
    width: 80,
    height: 240,
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#8b6914',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  targetZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(139, 105, 20, 0.25)',
  },
  pressureBar: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 12,
    borderRadius: 6,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f5e6c8',
    opacity: 0.6,
  },
  gaugeLabel: {
    color: '#8b6914',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 6,
  },
  bottom: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 24,
  },
  scoreLabel: {
    color: '#c9a96e',
    fontSize: 28,
    fontWeight: 'bold',
  },
  timerLabel: {
    color: '#8b6914',
    fontSize: 28,
  },
});
