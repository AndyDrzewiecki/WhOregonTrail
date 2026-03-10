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

  // Constants
  DEFAULT_RESOURCES,
  CONSUMPTION_RATES,
  MILES_PER_DAY,
  TRAIL_WAYPOINTS,
  TRAIL_EVENTS,

  // Reducer
  gameReducer,

  // Utilities
  getRelationshipLabel,
  getLocationDisplayName,
  selectTrailEvent,

  // Hook
  useGameState,
} from './state';
