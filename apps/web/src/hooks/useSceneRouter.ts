import type { GameState } from '@whoreagon-trail/game-engine';

export type SceneName =
  | 'WAGON_OPENER'
  | 'CHARACTER_INTRODUCTIONS'
  | 'CONFLICT'
  | 'PLANNING'
  | 'GATEKEEPER'
  | 'MINIGAME'
  | 'SUMMARY';

export function useSceneRouter(state: GameState | null): SceneName {
  if (!state || state.phase === 'PROLOGUE') {
    if (!state || !state.flags.includes('PROLOGUE_COMPLETE')) return 'WAGON_OPENER';
    return 'CHARACTER_INTRODUCTIONS';
  }
  if (state.phase === 'FORT') return 'GATEKEEPER';
  if (state.phase === 'CAMPFIRE') return 'SUMMARY';
  if (state.phase === 'FINALE' || state.phase === 'END') return 'SUMMARY';
  if (state.phase === 'TRAIL') {
    // Check if there's an active event that triggers minigame
    const lastEvent = state.eventHistory[state.eventHistory.length - 1];
    if (
      lastEvent?.type === 'hunting_opportunity' ||
      lastEvent?.type === 'performance_opportunity'
    ) {
      return 'MINIGAME';
    }
    return 'PLANNING';
  }
  return 'PLANNING';
}
