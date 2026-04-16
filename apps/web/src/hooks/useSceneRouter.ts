// NOTE: Production build (npm run build) requires running from PowerShell or cmd.exe
// with canonical Windows paths — not Git Bash. Git Bash's path mangling causes a
// Next.js 15 prerendering error on Windows. Use `npm run dev` for local playtest,
// or deploy to Vercel for zero-config production builds.
import type { GameState } from '@whoreagon-trail/game-engine';

export type SceneName =
  | 'WAGON_OPENER'
  | 'CHARACTER_INTRODUCTIONS'
  | 'SUPPLY_SHOP'
  | 'CONFLICT'
  | 'PLANNING'
  | 'COACHING'
  | 'DELEGATION'
  | 'GATEKEEPER'
  | 'ENTERTAINMENT_CIRCUIT'
  | 'FORT_SUPPLY'
  | 'MINIGAME'
  | 'SUMMARY'
  | 'VICTORY';

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
  if (state.phase === 'SETUP') return 'SUPPLY_SHOP';
  // Offer coaching before fort/performance if conditions are met
  if (
    state.phase === 'FORT' &&
    !state.flags.includes(`COACHED_DAY_${state.day}`) &&
    (
      (state.hiddenState?.resentment ?? 0) > 28 ||
      (state.hiddenState?.boundaryStrain ?? 0) > 28 ||
      (state.runMemory?.boundaryCrossed ?? false) ||
      (state.runMemory?.usedCharacterIds?.length ?? 0) > 0
    )
  ) {
    return 'COACHING';
  }
  // Delegate the Room: fires before GATEKEEPER or ENTERTAINMENT_CIRCUIT if not already done today
  // and party has at least 2 alive non-player members
  if (
    state.phase === 'FORT' &&
    !state.flags.includes(`DELEGATED_DAY_${state.day}`) &&
    state.party.filter(m => m.isAlive && m.id !== state.party[0]?.id).length >= 2
  ) {
    return 'DELEGATION';
  }
  // After the gatekeeper/performance is passed, show the fort supply shop
  if (state.phase === 'FORT' && state.flags.includes('FORT_SHOP_READY')) return 'FORT_SUPPLY';
  // Entertainment circuit performance negotiation takes priority over standard gate entry
  if (state.phase === 'FORT' && state.route?.type === 'entertainment_circuit') return 'ENTERTAINMENT_CIRCUIT';
  if (state.phase === 'FORT') return 'GATEKEEPER';
  if (state.phase === 'CAMPFIRE') return 'SUMMARY';
  if (state.phase === 'FINALE' || state.phase === 'END') return 'VICTORY';
  if (state.phase === 'TRAIL') {
    const lastEvent = state.eventHistory[state.eventHistory.length - 1];
    // Only route to event-based scenes for events from today (same day)
    const isTodaysEvent = lastEvent?.day === state.day;

    // Only route to an event scene if the event hasn't been resolved yet.
    // EVENT_RESOLVED is set by ConflictScene/MinigameInterruption after the player resolves
    // the encounter, and cleared at the start of the next day's ADVANCE_DAY.
    const eventResolved = state.flags.includes('EVENT_RESOLVED');
    if (isTodaysEvent && lastEvent && !eventResolved) {
      if (MINIGAME_EVENT_TYPES.has(lastEvent.type)) return 'MINIGAME';
      // Conflict scene always fires for conflict events; day % 3 can be used inside
      // ConflictScene itself to vary tone/framing (0=survival, 1=interpersonal, 2=moral).
      if (CONFLICT_EVENT_TYPES.has(lastEvent.type)) return 'CONFLICT';
    }
    return 'PLANNING';
  }
  return 'PLANNING';
}
