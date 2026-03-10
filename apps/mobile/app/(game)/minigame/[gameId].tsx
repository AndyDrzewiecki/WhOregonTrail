/**
 * MINIGAME SCREEN
 * Loads the config for the given gameId and renders the appropriate mechanic.
 * Currently supports: hunting (TapMechanic)
 */
import { View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGameState, HUNTING_MINIGAME, type MinigameConfig } from '@whoreagon-trail/game-engine';
import TapMechanic from '@/src/components/minigames/TapMechanic';
import { COLORS } from '@/src/constants/colors';

const MINIGAME_REGISTRY: Record<string, MinigameConfig> = {
  hunting: HUNTING_MINIGAME,
};

export default function MinigameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { state, dispatch } = useGameState();

  const config = gameId ? MINIGAME_REGISTRY[gameId] : undefined;

  if (!config) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: COLORS.goldDim, fontSize: 12, letterSpacing: 4, marginBottom: 16 }}>MINIGAME</Text>
        <Text style={{ color: COLORS.cream, fontSize: 20, fontWeight: 'bold', marginBottom: 32 }}>{gameId ?? '—'}</Text>
        <Pressable
          style={{ borderWidth: 1, borderColor: COLORS.goldDim, paddingHorizontal: 32, paddingVertical: 14 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: COLORS.cream, fontSize: 14, letterSpacing: 3 }}>BACK</Text>
        </Pressable>
      </View>
    );
  }

  const handleComplete = (hits: number, _misses: number) => {
    if (!state) return;
    // Award food proportional to hits, deduct ammo (absolute values for UPDATE_RESOURCES)
    const foodEarned = Math.round((config.reward.food ?? 0) * (hits / config.targetCount));
    const ammoUsed = hits + _misses;

    const changes: Record<string, number> = {};
    if (foodEarned > 0) changes.food = state.resources.food + foodEarned;
    if (ammoUsed > 0) changes.ammunition = Math.max(0, state.resources.ammunition - ammoUsed);
    if (Object.keys(changes).length > 0) {
      dispatch({ type: 'UPDATE_RESOURCES', changes });
    }

    // Navigate back after a brief pause
    setTimeout(() => router.back(), 1500);
  };

  return <TapMechanic config={config} onComplete={handleComplete} />;
}
