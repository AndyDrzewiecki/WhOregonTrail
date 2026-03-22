import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { useGameState } from '@whoreagon-trail/game-engine';
import { COLORS } from '@/src/constants/colors';

type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:   'Easy',
  normal: 'Normal',
  hard:   'Hard',
};

export default function SettingsScreen() {
  const { state, dispatch } = useGameState();
  const [isMuted, setIsMuted] = useState(false);

  const currentDifficulty: Difficulty = state?.difficulty ?? 'normal';

  const handleQuit = () => {
    dispatch({ type: 'END_RUN' });
    router.replace('/');
  };

  const handleToggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      await Audio.setAudioModeAsync({
        shouldDuckAndroid: !next,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });
    } catch {
      // expo-av may not be available in all environments — fail silently
    }
  };

  const handleSetDifficulty = (difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', difficulty });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>PAUSED</Text>

        <TouchableOpacity style={styles.resumeButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.resumeText}>Resume</Text>
        </TouchableOpacity>

        {/* Volume */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Volume</Text>
          <TouchableOpacity
            style={[styles.muteButton, isMuted && styles.muteButtonActive]}
            onPress={handleToggleMute}
            activeOpacity={0.7}
          >
            <Text style={[styles.muteButtonText, isMuted && styles.muteButtonTextActive]}>
              {isMuted ? 'Muted' : 'Sound On'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Difficulty</Text>
          <View style={styles.difficultyRow}>
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.difficultyButton,
                  currentDifficulty === d && styles.difficultyButtonSelected,
                ]}
                onPress={() => handleSetDifficulty(d)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    currentDifficulty === d && styles.difficultyButtonTextSelected,
                  ]}
                >
                  {DIFFICULTY_LABELS[d]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.quitButton} onPress={handleQuit} activeOpacity={0.8}>
          <Text style={styles.quitText}>Quit Run</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.cream,
    letterSpacing: 6,
    marginBottom: 24,
  },
  resumeButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 2,
    width: '100%',
    alignItems: 'center',
  },
  resumeText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
  section: {
    width: '100%',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.goldDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  muteButton: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
  },
  muteButtonActive: {
    borderColor: COLORS.error,
  },
  muteButtonText: {
    fontSize: 15,
    color: COLORS.cream,
    fontWeight: '600',
  },
  muteButtonTextActive: {
    color: COLORS.error,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    paddingVertical: 12,
    borderRadius: 2,
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cream,
  },
  difficultyButtonTextSelected: {
    color: COLORS.darkCard,
  },
  quitButton: {
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: 14,
    paddingHorizontal: 64,
    borderRadius: 2,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  quitText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});
