// NOTE: Production build (npm run build) requires running from PowerShell or cmd.exe
// with canonical Windows paths — not Git Bash. Git Bash's path mangling causes a
// Next.js 15 prerendering error on Windows. Use `npm run dev` for local playtest,
// or deploy to Vercel for zero-config production builds.
import type { GameState } from '@whoreagon-trail/game-engine';

export type SceneName =
  | 'WAGON_OPENER'
  | 'CHARACTER_INTRODUCTIONS'
  | 'CONFLICT'
  | 'PLANNING'
  | 'GATEKEEPER'
  | 'ENTERTAINMENT_CIRCUIT'
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
  // Entertainment circuit performance negotiation takes priority over standard gate entry
  if (state.phase === 'FORT' && state.route?.type === 'entertainment_circuit') return 'ENTERTAINMENT_CIRCUIT';
  if (state.phase === 'FORT') return 'GATEKEEPER';
  if (state.phase === 'CAMPFIRE') return 'SUMMARY';
  if (state.phase === 'FINALE' || state.phase === 'END') return 'SUMMARY';
  if (state.phase === 'TRAIL') {
    const lastEvent = state.eventHistory[state.eventHistory.length - 1];
    // Only route to event-based scenes for events from today (same day)
    const isTodaysEvent = lastEvent?.day === state.day;

    if (isTodaysEvent && lastEvent) {
      if (MINIGAME_EVENT_TYPES.has(lastEvent.type)) return 'MINIGAME';
      // Conflict scene always fires for conflict events; day % 3 can be used inside
      // ConflictScene itself to vary tone/framing (0=survival, 1=interpersonal, 2=moral).
      if (CONFLICT_EVENT_TYPES.has(lastEvent.type)) return 'CONFLICT';
    }
    return 'PLANNING';
  }
  return 'PLANNING';
}
