import type { GameState } from '@whoreagon-trail/game-engine';

export type SceneName =
  | 'WAGON_OPENER'
  | 'CHARACTER_INTRODUCTIONS'
  | 'CONFLICT'
  | 'PLANNING'
  | 'GATEKEEPER'
  | 'MINIGAME'
  | 'SUMMARY';

// Event types that route to MinigameInterruption
const MINIGAME_EVENT_TYPES = new Set([
  'hunting_opportunity',
  'performance_opportunity',
  'hunting',
]);

// Event types that route to ConflictScene
const CONFLICT_EVENT_TYPES = new Set([
  'hostile_encounter',
  'internal_conflict',
  'river_crossing',
  'illness',
  'broken_wheel',
  'abandoned_wagon',
]);

export function useSceneRouter(state: GameState | null): SceneName {
  if (!state || state.phase === 'PROLOGUE') {
    if (!state || !state.flags.includes('PROLOGUE_COMPLETE')) return 'WAGON_OPENER';
    return 'CHARACTER_INTRODUCTIONS';
  }
  if (state.phase === 'FORT') return 'GATEKEEPER';
  if (state.phase === 'CAMPFIRE') return 'SUMMARY';
  if (state.phase === 'FINALE' || state.phase === 'END') return 'SUMMARY';
  if (state.phase === 'TRAIL') {
    const lastEvent = state.eventHistory[state.eventHistory.length - 1];
    // Only route to event-based scenes for events from today (same day)
    const isTodaysEvent = lastEvent?.day === state.day;

    if (isTodaysEvent && lastEvent) {
      if (MINIGAME_EVENT_TYPES.has(lastEvent.type)) return 'MINIGAME';
      if (CONFLICT_EVENT_TYPES.has(lastEvent.type)) return 'CONFLICT';
    }
    return 'PLANNING';
  }
  return 'PLANNING';
}
