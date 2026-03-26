/**
 * MinigameEngine
 *
 * Routes to the correct mechanic component based on config.mechanic.
 * All performance minigames (RHYTHM, HOLD, SWIPE, TILT, BALANCE) pass
 * through here.  TAP/hunting goes directly to TapMechanic.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { type MinigameConfig } from '@whoreagon-trail/game-engine';
import { COLORS } from '@/src/constants/colors';

import TiltMechanic from './mechanics/TiltMechanic';
import RhythmMechanic from './mechanics/RhythmMechanic';
import BalanceMechanic from './mechanics/BalanceMechanic';
import HoldMechanic from './mechanics/HoldMechanic';
import SwipeMechanic from './mechanics/SwipeMechanic';

// ── Public types ──────────────────────────────────────────────────────────────

export type MinigameResult = {
  /** Overall tier driven by score */
  tier: 'SUCCESS' | 'PARTIAL' | 'FAILURE';
  /** 0–100 continuous score for money interpolation */
  score: number;
};

export interface MinigameEngineProps {
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
  onProgress?: (score: number) => void;
  /** Minimum score floor from character skills (0–20). Applied before tier calculation. */
  scoreFloor?: number;
}

// ── Utility ───────────────────────────────────────────────────────────────────

export function scoreToTier(score: number): 'SUCCESS' | 'PARTIAL' | 'FAILURE' {
  if (score >= 70) return 'SUCCESS';
  if (score >= 35) return 'PARTIAL';
  return 'FAILURE';
}

// ── Engine ────────────────────────────────────────────────────────────────────

export const MinigameEngine: React.FC<MinigameEngineProps> = ({
  config,
  onComplete,
  onProgress,
  scoreFloor = 0,
}) => {
  // Apply skill-derived score floor before forwarding result
  const handleComplete = React.useCallback(
    (result: MinigameResult) => {
      const boosted = Math.min(100, result.score + scoreFloor);
      onComplete({ score: boosted, tier: scoreToTier(boosted) });
    },
    [onComplete, scoreFloor],
  );

  switch (config.mechanic) {
    case 'TILT':
      return (
        <TiltMechanic
          config={config}
          onComplete={handleComplete}
          onProgress={onProgress}
        />
      );
    case 'RHYTHM':
      return (
        <RhythmMechanic
          config={config}
          onComplete={handleComplete}
          onProgress={onProgress}
        />
      );
    case 'BALANCE':
      return (
        <BalanceMechanic
          config={config}
          onComplete={handleComplete}
          onProgress={onProgress}
        />
      );
    case 'HOLD':
      return (
        <HoldMechanic
          config={config}
          onComplete={handleComplete}
          onProgress={onProgress}
        />
      );
    case 'SWIPE':
      return (
        <SwipeMechanic
          config={config}
          onComplete={handleComplete}
          onProgress={onProgress}
        />
      );
    default:
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: COLORS.goldDim, letterSpacing: 2 }}>
            UNKNOWN MECHANIC: {config.mechanic ?? 'none'}
          </Text>
        </View>
      );
  }
};

export default MinigameEngine;
