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
  type GameState,
  type GameAction,
  type CharacterId,

  // Constants
  DEFAULT_RESOURCES,
  CONSUMPTION_RATES,
  TRAIL_WAYPOINTS,

  // Reducer
  gameReducer,

  // Utilities
  getRelationshipLabel,

  // Hook
  useGameState,
} from './state';
