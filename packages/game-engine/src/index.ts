/**
 * @whoreagon-trail/game-engine
 *
 * Core game state machine, types, and the useGameState hook.
 */

export {
  // Types
  type Phase,
  type ResourceState,
  type PartyMember,
  type StressTag,
  type EventHistoryEntry,
  type TrailLocation,
  type TrailEventTemplate,
  type GameState,
  type GameAction,
  type EventOutcome,
  type CharacterId,
  type MinigameConfig,
  type RelationshipMatrix,
  type RouteType,
  type RouteProfile,
  type HiddenState,
  type RunMemory,
  type MemoryEvent,
  type MemoryEventType,
  type MemoryApproach,
  type MemorySentiment,

  // Constants
  DEFAULT_RESOURCES,
  DEFAULT_HIDDEN_STATE,
  DEFAULT_RUN_MEMORY,
  CONSUMPTION_RATES,
  MILES_PER_DAY,
  TRAIL_WAYPOINTS,
  TRAIL_EVENTS,
  HUNTING_MINIGAME,
  PERFORMANCE_MINIGAMES,

  // Reducer
  gameReducer,

  // Utilities
  getRelationshipLabel,
  getLocationDisplayName,
  getMilesBetween,
  selectTrailEvent,
  selectPerformanceMinigame,

  // Hook
  useGameState,
} from './state';

export type { StorageAdapter } from './storage';
export { localStorageAdapter } from './storage';
