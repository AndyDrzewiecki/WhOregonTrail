/**
 * MINIGAME SCREEN
 * Loads the config for the given gameId and renders the appropriate mechanic.
 * Supports: hunting (TapMechanic) + performance minigames (MinigameEngine)
 */
import { View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useGameState,
  HUNTING_MINIGAME,
  PERFORMANCE_MINIGAMES,
  type MinigameConfig,
} from '@whoreagon-trail/game-engine';
import TapMechanic from '@/src/components/minigames/TapMechanic';
import { MinigameEngine, type MinigameResult } from '@/src/components/minigames/MinigameEngine';
import { useSkillModifier } from '@/src/hooks/useSkillModifier';
import { COLORS } from '@/src/constants/colors';

const MINIGAME_REGISTRY: Record<string, MinigameConfig> = {
  hunting: HUNTING_MINIGAME,
  ...Object.fromEntries(PERFORMANCE_MINIGAMES.map((c) => [c.id, c])),
};

export default function MinigameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { state, dispatch } = useGameState();

  const config = gameId ? MINIGAME_REGISTRY[gameId] : undefined;
  const { scoreFloor, timeBonus } = useSkillModifier(config?.mechanic ?? (config ? 'TAP' : undefined));

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

  // Performance minigames (RHYTHM, HOLD, SWIPE, etc.) use MinigameEngine
  if (config.mechanic && config.mechanic !== 'TAP') {
    const handleEngineComplete = (result: MinigameResult) => {
      if (!state) return;

      // Map tier to money reward
      if (config.moneyReward) {
        const { min, max } = config.moneyReward;
        const multiplier =
          result.tier === 'SUCCESS' ? 1.0 :
          result.tier === 'PARTIAL' ? 0.5 :
          0.1;
        const earned = Math.round((min + (max - min) * (result.score / 100)) * multiplier);
        dispatch({
          type: 'UPDATE_RESOURCES',
          changes: { money: state.resources.money + earned },
        });
      }

      setTimeout(() => router.back(), 1500);
    };

    return <MinigameEngine config={config} onComplete={handleEngineComplete} scoreFloor={scoreFloor} />;
  }

  // TAP / hunting mechanic
  const handleComplete = (hits: number, _misses: number) => {
    if (!state) return;
    const foodEarned = Math.round((config.reward.food ?? 0) * (hits / config.targetCount));
    const ammoUsed = hits + _misses;

    const changes: Record<string, number> = {};
    if (foodEarned > 0) changes.food = state.resources.food + foodEarned;
    if (ammoUsed > 0) changes.ammunition = Math.max(0, state.resources.ammunition - ammoUsed);
    if (Object.keys(changes).length > 0) {
      dispatch({ type: 'UPDATE_RESOURCES', changes });
    }

    setTimeout(() => router.back(), 1500);
  };

  const boostedConfig: MinigameConfig = { ...config, durationMs: config.durationMs + timeBonus };
  return <TapMechanic config={boostedConfig} onComplete={handleComplete} />;
}
