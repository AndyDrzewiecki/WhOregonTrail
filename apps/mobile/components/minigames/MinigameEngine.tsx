/**
 * MinigameEngine — routes to the correct mechanic component.
 *
 * Responsible for:
 * 1. Reading the MinigameConfig
 * 2. Rendering the correct mechanic component
 * 3. Tracking completion %
 * 4. Firing haptic feedback
 * 5. Calling onComplete with the result score (0–100)
 *
 * Does NOT render narrative dialogue — that's the parent screen's job.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { MinigameConfig } from '@whoreagon-trail/game-engine';

import { TiltMechanic } from './mechanics/TiltMechanic';
import { RhythmMechanic } from './mechanics/RhythmMechanic';
import { BalanceMechanic } from './mechanics/BalanceMechanic';
import { HoldMechanic } from './mechanics/HoldMechanic';
import { SwipeMechanic } from './mechanics/SwipeMechanic';

// ── Types ─────────────────────────────────────────────────────────────────

export interface MinigameResult {
  score: number;       // 0–100
  tier: 'SUCCESS' | 'PARTIAL' | 'FAILURE';
  durationMs: number;
}

interface Props {
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
}

// ── Haptic helpers ────────────────────────────────────────────────────────

export async function fireHaptic(descriptor: string): Promise<void> {
  try {
    switch (descriptor) {
      case 'LIGHT':   return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'MEDIUM':  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'HEAVY':   return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      case 'RIGID':   return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      case 'SOFT':    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      case 'SUCCESS': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'WARNING': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'ERROR':   return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      default:        return Haptics.selectionAsync();
    }
  } catch {
    // Haptics not available (simulator / device without taptic engine) — ignore
  }
}

export function scoreToTier(score: number): MinigameResult['tier'] {
  if (score >= 80) return 'SUCCESS';
  if (score >= 50) return 'PARTIAL';
  return 'FAILURE';
}

// ── Engine ────────────────────────────────────────────────────────────────

export function MinigameEngine({ config, onComplete }: Props) {
  const startTime = React.useRef(Date.now());

  const handleComplete = useCallback(
    async (rawScore: number) => {
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      const tier = scoreToTier(score);
      const durationMs = Date.now() - startTime.current;

      await fireHaptic(
        tier === 'SUCCESS'
          ? config.hapticOnSuccess
          : tier === 'PARTIAL'
          ? config.hapticOnProgress
          : config.hapticOnFailure
      );

      onComplete({ score, tier, durationMs });
    },
    [config, onComplete]
  );

  const sharedProps = {
    config,
    onComplete: handleComplete,
    onProgress: (pct: number) => {
      // Fire progress haptic every 25% milestone
      if (pct % 25 < 5) {
        fireHaptic(config.hapticOnProgress);
      }
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.task}>{config.taskDescription}</Text>

      <View style={styles.mechanicArea}>
        {config.mechanic === 'TILT' && <TiltMechanic {...sharedProps} />}
        {config.mechanic === 'RHYTHM' && <RhythmMechanic {...sharedProps} />}
        {config.mechanic === 'BALANCE' && <BalanceMechanic {...sharedProps} />}
        {config.mechanic === 'HOLD' && <HoldMechanic {...sharedProps} />}
        {config.mechanic === 'SWIPE' && <SwipeMechanic {...sharedProps} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a00',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  title: {
    color: '#f5e6c8',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  task: {
    color: '#c9a96e',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  mechanicArea: {
    flex: 1,
    width: '100%',
  },
});
