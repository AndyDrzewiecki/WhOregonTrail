import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGameState } from '@whoreagon-trail/game-engine';
import { generateEpilogue, type AIResponse } from '@whoreagon-trail/ai-client';
import { COLORS } from '@/src/constants/colors';

export default function FinaleScreen() {
  const { state, dispatch } = useGameState();
  const [epilogue, setEpilogue] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.phase !== 'FINALE') {
      dispatch({ type: 'SET_PHASE', phase: 'FINALE' });
    }

    let cancelled = false;

    async function loadEpilogue() {
      try {
        const response = await generateEpilogue(state!);
        if (!cancelled) {
          setEpilogue(response);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setIsLoading(false);
        }
      }
    }

    loadEpilogue();
    return () => { cancelled = true; };
  }, []);

  if (!state) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.title}>The Columbia River</Text>
          <Text style={styles.subtitle}>The end of the trail.</Text>
          <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.title}>The Columbia River</Text>
          <Text style={styles.errorText}>The frontier kept its secrets.</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push('/(game)/end')}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Build fate cards from party + epilogue dialogue
  const fateMap: Record<string, string> = {};
  if (epilogue?.dialogue) {
    for (const msg of epilogue.dialogue) {
      fateMap[msg.characterId] = msg.text;
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>The Columbia River</Text>
      <Text style={styles.subtitle}>
        After {state.day} days on the trail, the journey ends.
      </Text>

      <ScrollView
        style={styles.cardsScroll}
        contentContainerStyle={styles.cardsContent}
        showsVerticalScrollIndicator={false}
      >
        {state.party.map((member) => {
          const fate = fateMap[member.id] ?? (member.isAlive ? 'Made it to Oregon.' : 'Lost along the way.');
          return (
            <View
              key={member.id}
              style={[
                styles.fateCard,
                member.isAlive ? styles.fateCardAlive : styles.fateCardDead,
              ]}
            >
              <Text style={[styles.fateName, !member.isAlive && styles.fateNameDead]}>
                {member.name}
              </Text>
              <Text style={[styles.fateStatus, !member.isAlive && styles.fateStatusDead]}>
                {member.isAlive ? 'Survived' : `Fell on Day ${member.joinedOnDay > 0 ? '—' : state.day}`}
              </Text>
              <Text style={[styles.fateText, !member.isAlive && styles.fateTextDead]}>
                {fate}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/(game)/end')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue to Summary</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: COLORS.goldDim,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.gold,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.goldDim,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    fontStyle: 'italic',
    marginTop: 12,
    marginBottom: 24,
  },
  cardsScroll: {
    flex: 1,
  },
  cardsContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  fateCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
  },
  fateCardAlive: {
    backgroundColor: COLORS.darkCard,
    borderColor: COLORS.gold,
  },
  fateCardDead: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.muted,
  },
  fateName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gold,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fateNameDead: {
    color: COLORS.muted,
  },
  fateStatus: {
    fontSize: 12,
    color: COLORS.goldDim,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  fateStatusDead: {
    color: COLORS.error,
  },
  fateText: {
    fontSize: 14,
    color: COLORS.cream,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  fateTextDead: {
    color: COLORS.muted,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  continueButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
});
