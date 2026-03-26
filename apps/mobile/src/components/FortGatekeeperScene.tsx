/**
 * FortGatekeeperScene
 *
 * A single-exchange AI dialogue that plays out when the party first arrives
 * at a fort. The gatekeeper NPC asks "What brings you to our fort?" and the
 * player responds via TypeBox. The AI generates a reaction using resolveEvent()
 * with a synthetic "fort_arrival" event.
 *
 * Usage:
 *   <FortGatekeeperScene
 *     gameState={state}
 *     fortName="Fort Kearney"
 *     onComplete={() => { /* proceed to hub * / }}
 *   />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { resolveEvent } from '@whoreagon-trail/ai-client';
import type { GameState } from '@whoreagon-trail/game-engine';
import { TypeBox } from '@/src/components/TypeBox';
import { COLORS } from '@/src/constants/colors';

type ScenePhase = 'question' | 'loading' | 'reaction' | 'error';

interface FortGatekeeperSceneProps {
  gameState: GameState;
  fortName: string;
  onComplete: () => void;
}

export default function FortGatekeeperScene({
  gameState,
  fortName,
  onComplete,
}: FortGatekeeperSceneProps) {
  const [phase, setPhase] = useState<ScenePhase>('question');
  const [reactionText, setReactionText] = useState('');

  const handlePlayerResponse = async (playerText: string) => {
    setPhase('loading');
    try {
      const response = await resolveEvent(
        gameState,
        {
          type: 'fort_arrival',
          description: `The party arrives at ${fortName}. The gatekeeper asks what brings them here.`,
        },
        playerText
      );

      const firstLine = response.dialogue[0]?.text ?? 'The gatekeeper nods and waves you through.';
      setReactionText(firstLine);
      setPhase('reaction');
    } catch {
      setPhase('error');
    }
  };

  if (phase === 'question') {
    return (
      <View style={styles.container}>
        <Text style={styles.npcLabel}>GATEKEEPER</Text>
        <Text style={styles.npcSpeech}>
          "What brings you to our fort?"
        </Text>
        <View style={styles.typeboxWrapper}>
          <TypeBox
            onSubmit={handlePlayerResponse}
            placeholder="Speak your piece..."
          />
        </View>
      </View>
    );
  }

  if (phase === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.gold} />
        <Text style={styles.loadingText}>The gatekeeper considers your words...</Text>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.npcLabel}>GATEKEEPER</Text>
        <Text style={styles.npcSpeech}>
          "Right. Move along then."
        </Text>
        <TouchableOpacity style={styles.continueButton} onPress={onComplete}>
          <Text style={styles.continueText}>Enter the Fort</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // reaction phase
  return (
    <View style={styles.container}>
      <Text style={styles.npcLabel}>GATEKEEPER</Text>
      <Text style={styles.npcSpeech}>"{reactionText}"</Text>
      <TouchableOpacity style={styles.continueButton} onPress={onComplete}>
        <Text style={styles.continueText}>Enter the Fort</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
    justifyContent: 'center',
    gap: 20,
  },
  npcLabel: {
    fontSize: 11,
    color: COLORS.goldDim,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  npcSpeech: {
    fontSize: 18,
    color: COLORS.cream,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  typeboxWrapper: {
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  continueButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 16,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
});
