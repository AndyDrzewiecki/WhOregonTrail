/**
 * SwipeMechanic
 *
 * Player follows a choreography sequence by swiping in the shown directions.
 * Each correct swipe earns points; wrong direction resets the current step.
 * Haptic feedback confirms each correct swipe.
 *
 * Double meaning: "follow the choreography" is the cover story.
 * Swipe up, swipe right, swipe down — frontier calisthenics.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/src/constants/colors';
import { scoreToTier } from '../MinigameEngine';
import type { MechanicProps } from './shared';

type Direction = 'up' | 'down' | 'left' | 'right';

const ARROW: Record<Direction, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

const MIN_SWIPE_DISTANCE = 40;

function detectSwipe(dx: number, dy: number): Direction | null {
  if (Math.abs(dx) < MIN_SWIPE_DISTANCE && Math.abs(dy) < MIN_SWIPE_DISTANCE) {
    return null;
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

export default function SwipeMechanic({ config, onComplete, onProgress }: MechanicProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [currentStep, setCurrentStep] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);

  const sequence: Direction[] = (config.params?.swipeSequence ?? ['up', 'right', 'down', 'left']) as Direction[];
  const totalSteps = sequence.length;

  const handleSwipe = useCallback(
    (direction: Direction) => {
      if (phase !== 'playing') return;

      const expected = sequence[currentStep];
      if (direction === expected) {
        setLastResult('correct');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const nextStep = currentStep + 1;
        const nextCorrect = correctCount + 1;
        setCorrectCount(nextCorrect);
        onProgress?.(Math.round((nextCorrect / totalSteps) * 100));

        if (nextStep >= totalSteps) {
          // Sequence complete
          setPhase('result');
        } else {
          setCurrentStep(nextStep);
        }
      } else {
        setLastResult('wrong');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Reset to beginning of sequence on wrong swipe
        setCurrentStep(0);
      }

      setTimeout(() => setLastResult(null), 300);
    },
    [phase, currentStep, correctCount, totalSteps, sequence, onProgress]
  );

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10,
    onPanResponderRelease: (_, gs) => {
      const dir = detectSwipe(gs.dx, gs.dy);
      if (dir) handleSwipe(dir);
    },
  });

  // Complete via result phase
  React.useEffect(() => {
    if (phase !== 'result') return;
    const score = Math.min(100, Math.round((correctCount / totalSteps) * 100));
    Haptics.notificationAsync(
      score >= 70
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
    const timer = setTimeout(() => {
      onComplete({ tier: scoreToTier(score), score });
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, correctCount, totalSteps, onComplete]);

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.instructions}>
          {config.taskDescription ?? 'Follow the choreography.'}
          {'\n\n'}
          Swipe in the direction shown. Wrong swipe resets your step.
        </Text>
        <View
          {...PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => setPhase('playing'),
          }).panHandlers}
          style={styles.startButton}
        >
          <Text style={styles.startText}>BEGIN</Text>
        </View>
      </View>
    );
  }

  if (phase === 'result') {
    const score = Math.min(100, Math.round((correctCount / totalSteps) * 100));
    const tier = scoreToTier(score);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {tier === 'SUCCESS'
            ? 'PERFECT FORM'
            : tier === 'PARTIAL'
            ? 'DECENT MOVES'
            : 'LOST THE STEPS'}
        </Text>
        <Text style={styles.resultScore}>
          {correctCount} / {totalSteps} moves
        </Text>
      </View>
    );
  }

  const currentDirection = sequence[currentStep];
  const borderColor =
    lastResult === 'correct'
      ? COLORS.gold
      : lastResult === 'wrong'
      ? COLORS.error
      : COLORS.goldDim;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Sequence preview */}
      <View style={styles.sequenceRow}>
        {sequence.map((dir, idx) => (
          <Text
            key={idx}
            style={[
              styles.sequenceArrow,
              idx === currentStep && styles.sequenceArrowActive,
              idx < currentStep && styles.sequenceArrowDone,
            ]}
          >
            {ARROW[dir]}
          </Text>
        ))}
      </View>

      {/* Big current arrow */}
      <View style={[styles.arrowContainer, { borderColor }]}>
        <Text style={styles.bigArrow}>{ARROW[currentDirection]}</Text>
      </View>

      <Text style={styles.stepLabel}>
        {currentStep + 1} / {totalSteps}
      </Text>

      <Text style={styles.hint}>Swipe to match</Text>
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
  sequenceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sequenceArrow: {
    fontSize: 18,
    color: COLORS.muted,
  },
  sequenceArrowActive: {
    color: COLORS.gold,
    fontSize: 22,
  },
  sequenceArrowDone: {
    color: COLORS.darkCard,
  },
  arrowContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    backgroundColor: COLORS.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigArrow: {
    fontSize: 64,
    color: COLORS.cream,
  },
  stepLabel: {
    fontSize: 14,
    color: COLORS.goldDim,
    letterSpacing: 2,
  },
  hint: {
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 3,
    position: 'absolute',
    bottom: 40,
  },
  resultScore: {
    fontSize: 22,
    color: COLORS.cream,
    fontWeight: '700',
  },
});
