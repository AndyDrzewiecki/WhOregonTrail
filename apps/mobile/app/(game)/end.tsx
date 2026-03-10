import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGameState, getLocationDisplayName } from '@whoreagon-trail/game-engine';
import { COLORS } from '@/src/constants/colors';

export default function EndScreen() {
  const { state, dispatch } = useGameState();

  if (!state) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const survivors = state.party.filter((m) => m.isAlive).length;
  const totalParty = state.party.length;
  const reachedOregon = state.location === 'oregon_city';

  const handlePlayAgain = () => {
    dispatch({ type: 'END_RUN' });
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Run Complete</Text>
        <Text style={styles.subtitle}>
          {reachedOregon
            ? 'Your troupe reached Oregon City.'
            : `The journey ended at ${getLocationDisplayName(state.location)}.`}
        </Text>

        <View style={styles.statsContainer}>
          <StatRow label="Days on Trail" value={`${state.day}`} />
          <StatRow label="Miles Traveled" value={`${state.totalMilesTraveled ?? 0}`} />
          <StatRow label="Survivors" value={`${survivors} / ${totalParty}`} />
          <StatRow label="Money Remaining" value={`$${state.resources.money.toFixed(0)}`} />
          <StatRow label="Final Location" value={getLocationDisplayName(state.location)} />
          <StatRow label="Events Witnessed" value={`${state.eventHistory.length}`} />
        </View>

        <TouchableOpacity
          style={styles.playAgainButton}
          onPress={handlePlayAgain}
          activeOpacity={0.8}
        >
          <Text style={styles.playAgainText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.goldDim,
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.gold,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.cream,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 40,
    lineHeight: 22,
  },
  statsContainer: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    borderRadius: 4,
    padding: 16,
    marginBottom: 40,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.goldDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cream,
  },
  playAgainButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
});
