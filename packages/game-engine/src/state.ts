/**
 * Core game state machine for Whoreagon Trail.
 *
 * Contains all types, the reducer, constants, and the useGameState hook.
 * State is persisted to AsyncStorage under 'game:currentRun'.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Character,
  type CharacterId,
  type RelationshipMatrix,
  createRelationshipMatrix,
  getRelationshipLabel,
} from '@whoreagon-trail/characters';
import { useState, useEffect, useReducer, useCallback, useRef } from 'react';

// ── Re-export for consumers ──────────────────────────────────────────────────
export { getRelationshipLabel };
export type { CharacterId };

// ── Phase ────────────────────────────────────────────────────────────────────

export type Phase = 'PROLOGUE' | 'SETUP' | 'TRAIL' | 'FORT' | 'FINALE' | 'END';

// ── ResourceState ────────────────────────────────────────────────────────────

export type ResourceState = {
  food: number;       // pounds
  water: number;      // barrels
  money: number;      // dollars
  oxenHealth: number; // 0-100
  wagonHealth: number; // 0-100
  ammunition: number;
  medicine: number;
  wagonParts: {
    wheels: number;
    axles: number;
    tongues: number;
  };
};

// ── PartyMember ──────────────────────────────────────────────────────────────

export type PartyMember = Character & {
  health: number;    // 0-100
  isAlive: boolean;
  joinedOnDay: number;
};

// ── StressTag ────────────────────────────────────────────────────────────────

export type StressTag =
  | 'survival'
  | 'loss'
  | 'betrayal'
  | 'friendship'
  | 'sacrifice'
  | 'conflict'
  | 'discovery'
  | 'achievement';

// ── EventHistoryEntry ────────────────────────────────────────────────────────

export type EventHistoryEntry = {
  day: number;
  type: string;
  description: string;
  stressTag?: StressTag;
  involvedCharacterIds: CharacterId[];
  location: string;
};

// ── TrailLocation ────────────────────────────────────────────────────────────

export type TrailLocation =
  | 'independence_mo'
  | 'fort_kearney'
  | 'chimney_rock'
  | 'fort_laramie'
  | 'south_pass'
  | 'fort_bridger'
  | 'fort_hall'
  | 'fort_boise'
  | 'the_dalles'
  | 'oregon_city';

// ── GameState ────────────────────────────────────────────────────────────────

export type GameState = {
  runId: string;
  phase: Phase;
  day: number;
  location: TrailLocation;
  party: PartyMember[];
  resources: ResourceState;
  relationshipMatrix: RelationshipMatrix;
  eventHistory: EventHistoryEntry[]; // capped at last 50
  flags: string[];
  money: number;
};

// ── Default resource values for a new run ────────────────────────────────────

export const DEFAULT_RESOURCES: ResourceState = {
  food: 0,
  water: 0,
  money: 0,
  oxenHealth: 100,
  wagonHealth: 100,
  ammunition: 0,
  medicine: 0,
  wagonParts: { wheels: 2, axles: 1, tongues: 1 },
};

// ── Resource consumption per day per person at each pace ─────────────────────

export const CONSUMPTION_RATES = {
  rest:     { food: 1.5, water: 0.3 },
  steady:   { food: 2.0, water: 0.4 },
  grueling: { food: 2.5, water: 0.6 },
};

// ── Trail waypoints in order ─────────────────────────────────────────────────

export const TRAIL_WAYPOINTS: TrailLocation[] = [
  'independence_mo',
  'fort_kearney',
  'chimney_rock',
  'fort_laramie',
  'south_pass',
  'fort_bridger',
  'fort_hall',
  'fort_boise',
  'the_dalles',
  'oregon_city',
];

// ── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'game:currentRun';

// ── GameAction ───────────────────────────────────────────────────────────────

export type GameAction =
  | { type: 'START_RUN'; party: Character[] }
  | { type: 'SET_PHASE'; phase: Phase }
  | { type: 'ADVANCE_DAY'; pace: 'rest' | 'steady' | 'grueling' }
  | { type: 'UPDATE_RESOURCES'; changes: Partial<ResourceState> }
  | { type: 'APPLY_RELATIONSHIP_DELTA'; characterA: CharacterId; characterB: CharacterId; delta: number }
  | { type: 'ADD_EVENT'; entry: EventHistoryEntry }
  | { type: 'SET_FLAG'; flag: string }
  | { type: 'REMOVE_FLAG'; flag: string }
  | { type: 'UPDATE_CHARACTER_HEALTH'; characterId: CharacterId; health: number }
  | { type: 'MARK_CHARACTER_DEAD'; characterId: CharacterId }
  | { type: 'END_RUN' };

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Reducer ──────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_RUN': {
      const party: PartyMember[] = action.party.map((c) => ({
        ...c,
        health: 100,
        isAlive: true,
        joinedOnDay: 0,
      }));

      return {
        runId: generateRunId(),
        phase: 'PROLOGUE',
        day: 0,
        location: 'independence_mo',
        party,
        resources: { ...DEFAULT_RESOURCES, wagonParts: { ...DEFAULT_RESOURCES.wagonParts } },
        relationshipMatrix: createRelationshipMatrix(action.party),
        eventHistory: [],
        flags: [],
        money: 0,
      };
    }

    case 'SET_PHASE': {
      return { ...state, phase: action.phase };
    }

    case 'ADVANCE_DAY': {
      // Increment day
      const newDay = state.day + 1;

      // Deduct food and water based on party size × pace consumption rate
      const aliveCount = state.party.filter((m) => m.isAlive).length;
      const rate = CONSUMPTION_RATES[action.pace];
      const foodCost = aliveCount * rate.food;
      const waterCost = aliveCount * rate.water;

      const newResources: ResourceState = {
        ...state.resources,
        wagonParts: { ...state.resources.wagonParts },
        food: Math.max(0, state.resources.food - foodCost),
        water: Math.max(0, state.resources.water - waterCost),
      };

      // Cap eventHistory at 50 entries (drop oldest first)
      const cappedHistory =
        state.eventHistory.length > 50
          ? state.eventHistory.slice(state.eventHistory.length - 50)
          : state.eventHistory;

      return {
        ...state,
        day: newDay,
        resources: newResources,
        money: newResources.money,
        eventHistory: cappedHistory,
      };
    }

    case 'UPDATE_RESOURCES': {
      const newResources = { ...state.resources, wagonParts: { ...state.resources.wagonParts } };

      for (const [key, value] of Object.entries(action.changes)) {
        if (key === 'wagonParts' && typeof value === 'object' && value !== null) {
          newResources.wagonParts = {
            ...newResources.wagonParts,
            ...(value as Partial<ResourceState['wagonParts']>),
          };
        } else if (key !== 'wagonParts') {
          (newResources as Record<string, unknown>)[key] = value;
        }
      }

      // Clamp health-like values
      newResources.oxenHealth = clamp(newResources.oxenHealth, 0, 100);
      newResources.wagonHealth = clamp(newResources.wagonHealth, 0, 100);
      newResources.food = Math.max(0, newResources.food);
      newResources.water = Math.max(0, newResources.water);
      newResources.ammunition = Math.max(0, newResources.ammunition);
      newResources.medicine = Math.max(0, newResources.medicine);
      newResources.money = Math.max(0, newResources.money);

      return {
        ...state,
        resources: newResources,
        money: newResources.money,
      };
    }

    case 'APPLY_RELATIONSHIP_DELTA': {
      const { characterA, characterB, delta } = action;
      const matrix = { ...state.relationshipMatrix };

      if (!matrix[characterA]) matrix[characterA] = {};
      if (!matrix[characterB]) matrix[characterB] = {};

      matrix[characterA] = {
        ...matrix[characterA],
        [characterB]: clamp((matrix[characterA][characterB] ?? 0) + delta, -100, 100),
      };
      matrix[characterB] = {
        ...matrix[characterB],
        [characterA]: clamp((matrix[characterB][characterA] ?? 0) + delta, -100, 100),
      };

      return { ...state, relationshipMatrix: matrix };
    }

    case 'ADD_EVENT': {
      const newHistory = [...state.eventHistory, action.entry];
      // Cap at 50 entries, drop oldest first
      const capped = newHistory.length > 50 ? newHistory.slice(newHistory.length - 50) : newHistory;
      return { ...state, eventHistory: capped };
    }

    case 'SET_FLAG': {
      if (state.flags.includes(action.flag)) return state;
      return { ...state, flags: [...state.flags, action.flag] };
    }

    case 'REMOVE_FLAG': {
      return { ...state, flags: state.flags.filter((f) => f !== action.flag) };
    }

    case 'UPDATE_CHARACTER_HEALTH': {
      return {
        ...state,
        party: state.party.map((m) =>
          m.id === action.characterId
            ? { ...m, health: clamp(action.health, 0, 100) }
            : m
        ),
      };
    }

    case 'MARK_CHARACTER_DEAD': {
      return {
        ...state,
        party: state.party.map((m) =>
          m.id === action.characterId
            ? { ...m, isAlive: false, health: 0 }
            : m
        ),
      };
    }

    case 'END_RUN': {
      // Clear AsyncStorage key (fire-and-forget)
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      return { ...state, phase: 'END' };
    }

    default: {
      return state;
    }
  }
}

// ── useGameState hook ────────────────────────────────────────────────────────

/**
 * Primary hook for accessing game state.
 *
 * Returns { state, dispatch } where state is GameState | null.
 * - State loaded from AsyncStorage on mount under key 'game:currentRun'.
 * - Persisted to AsyncStorage on every state change.
 * - If no saved state, returns null (not an empty state — the UI needs to
 *   know there's no active run).
 */
export function useGameState(): {
  state: GameState | null;
  dispatch: (action: GameAction) => void;
} {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasDispatched, setHasDispatched] = useState(false);
  const [savedState, setSavedState] = useState<GameState | null>(null);
  const hydratedRef = useRef(false);

  // Sentinel initial state for useReducer (only used after first dispatch)
  const initialState: GameState = {
    runId: '',
    phase: 'PROLOGUE',
    day: 0,
    location: 'independence_mo',
    party: [],
    resources: { ...DEFAULT_RESOURCES, wagonParts: { ...DEFAULT_RESOURCES.wagonParts } },
    relationshipMatrix: {},
    eventHistory: [],
    flags: [],
    money: 0,
  };

  const [reducerState, rawDispatch] = useReducer(gameReducer, initialState);

  // Load from AsyncStorage on mount
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed: GameState = JSON.parse(raw);
          setSavedState(parsed);
        }
      } catch {
        // Corrupted save — start fresh
        console.warn('[game-engine] Failed to hydrate state from AsyncStorage');
      } finally {
        if (!cancelled) {
          hydratedRef.current = true;
          setIsHydrated(true);
        }
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  // Determine the "live" state:
  // - Before hydration: null
  // - After hydration with no saved state and no dispatches: null
  // - After hydration with saved state and no dispatches: savedState
  // - After any dispatch: reducerState (if it has a runId)
  const currentState: GameState | null = !isHydrated
    ? null
    : hasDispatched
      ? (reducerState.runId ? reducerState : null)
      : savedState;

  // Persist to AsyncStorage on every meaningful state change
  useEffect(() => {
    if (!isHydrated) return;
    if (!currentState) return;
    if (!currentState.runId) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentState)).catch((err) => {
      console.warn('[game-engine] Failed to persist state:', err);
    });
  }, [currentState, isHydrated]);

  const dispatch = useCallback(
    (action: GameAction) => {
      setHasDispatched(true);
      rawDispatch(action);
    },
    []
  );

  return { state: currentState, dispatch };
}
