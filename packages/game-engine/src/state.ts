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
export type { CharacterId, RelationshipMatrix };

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

// ── TrailEventTemplate ───────────────────────────────────────────────────────

export type TrailEventTemplate = {
  id: string;
  type: string;
  description: string;
  choices: string[];         // 2-3 player-facing choice strings
  weightedWhen: 'always' | 'lowResources' | 'highHealth';
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
  milesUntilNextStop: number;
  totalMilesTraveled: number;
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

// ── Miles per day at each pace ──────────────────────────────────────────────

export const MILES_PER_DAY = {
  rest: 0,
  steady: 15,
  grueling: 25,
} as const;

// ── Miles between consecutive trail waypoints ───────────────────────────────

export const MILES_BETWEEN_WAYPOINTS: Record<string, number> = {
  'independence_mo->fort_kearney':  200,
  'fort_kearney->chimney_rock':     120,
  'chimney_rock->fort_laramie':      80,
  'fort_laramie->south_pass':       180,
  'south_pass->fort_bridger':       120,
  'fort_bridger->fort_hall':        200,
  'fort_hall->fort_boise':          180,
  'fort_boise->the_dalles':         250,
  'the_dalles->oregon_city':        100,
};

export function getMilesBetween(from: TrailLocation, to: TrailLocation): number {
  return MILES_BETWEEN_WAYPOINTS[`${from}->${to}`] ?? 200;
}

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

// ── Trail events ─────────────────────────────────────────────────────────────

export const TRAIL_EVENTS: TrailEventTemplate[] = [
  {
    id: 'broken_wheel',
    type: 'broken_wheel',
    description: 'A crack runs through one of your wagon wheels. It could give out any time now.',
    choices: [
      'Use a spare wheel to replace it',
      'Slow our pace to reduce stress on it',
      'Press on and hope it holds',
    ],
    weightedWhen: 'always',
  },
  {
    id: 'river_crossing',
    type: 'river_crossing',
    description: 'The river ahead runs swift and deep after recent rains. There are a few ways to cross.',
    choices: [
      'Ford the river directly',
      'Pay $8 to take the ferry',
      'Scout upstream for a shallower crossing (+1 day)',
    ],
    weightedWhen: 'always',
  },
  {
    id: 'illness',
    type: 'illness',
    description: 'One of your party members is running a fever and can barely walk.',
    choices: [
      'Use a medicine kit to treat them',
      'Rest for a day to let them recover',
      'Keep moving and hope they push through',
    ],
    weightedWhen: 'always',
  },
  {
    id: 'hunting_opportunity',
    type: 'hunting_opportunity',
    description: 'You spot a deer in the brush. Fresh meat would do everyone some good.',
    choices: [
      'Hunt it (uses 5 ammo)',
      'Pass and conserve your supplies',
      'Set a trap and circle back (no ammo used)',
    ],
    weightedWhen: 'highHealth',
  },
  {
    id: 'other_travelers',
    type: 'other_travelers',
    description: 'Another wagon train rolls into view. They look road-worn but friendly enough.',
    choices: [
      'Trade supplies with them',
      'Ask for news from the trail ahead',
      'Keep to yourselves and move on',
    ],
    weightedWhen: 'always',
  },
  {
    id: 'hostile_encounter',
    type: 'hostile_encounter',
    description: 'A group of rough-looking men blocks the trail ahead, demanding you stop.',
    choices: [
      'Stand and fight (uses ammo)',
      'Negotiate with money',
      'Double back and take a detour (+1 day)',
    ],
    weightedWhen: 'always',
  },
  {
    id: 'performance_opportunity',
    type: 'performance_opportunity',
    description: 'A small settlement sits just off the trail. Smoke from chimneys, people milling about.',
    choices: [
      'Put on the full show',
      'Perform a short set for a quick earn',
      'Decline and keep moving',
    ],
    weightedWhen: 'highHealth',
  },
  {
    id: 'campfire_moment',
    type: 'campfire_moment',
    description: 'A quiet night settles over camp. The stars are out and no one is in a hurry to sleep.',
    choices: [
      'Listen to the others share stories',
      'Encourage the weary travelers',
      'Share your own story with the group',
    ],
    weightedWhen: 'always',
  },
];

export function selectTrailEvent(state: GameState): TrailEventTemplate | null {
  if (Math.random() < 0.65) return null;
  const aliveMembers = state.party.filter((m) => m.isAlive);
  const avgHealth =
    aliveMembers.length > 0
      ? aliveMembers.reduce((sum, m) => sum + m.health, 0) / aliveMembers.length
      : 50;
  const isLow = state.resources.food < 30 || state.resources.water < 1;
  const isHigh = avgHealth > 70;
  const eligible = TRAIL_EVENTS.filter(
    (e) =>
      e.weightedWhen === 'always' ||
      (e.weightedWhen === 'lowResources' && isLow) ||
      (e.weightedWhen === 'highHealth' && isHigh)
  );
  if (!eligible.length) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

// ── Minigame config ─────────────────────────────────────────────────────────

export type MinigameConfig = {
  id: string;
  title: string;
  durationMs: number;
  targetCount: number;
  spawnIntervalMs: number;
  targetLifetimeMs: number;
  reward: Partial<ResourceState>;
  penaltyPerMiss?: Partial<ResourceState>;
};

export const HUNTING_MINIGAME: MinigameConfig = {
  id: 'hunting',
  title: 'HUNTING',
  durationMs: 15000,
  targetCount: 8,
  spawnIntervalMs: 1500,
  targetLifetimeMs: 2000,
  reward: { food: 40 },
  penaltyPerMiss: { ammunition: -1 },
};

// ── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'game:currentRun';

// ── EventOutcome ─────────────────────────────────────────────────────────

export type EventOutcome = {
  resourceChanges?: Partial<ResourceState>;
  healthChanges?: Array<{ characterId: string; delta: number }>;
  relationshipDeltas?: Record<string, number>; // characterId -> delta vs player
  newFlags?: string[];
};

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
  | { type: 'ADD_PARTY_MEMBERS'; members: Character[] }
  | { type: 'ADVANCE_LOCATION' }
  | { type: 'APPLY_EVENT_OUTCOME'; outcome: EventOutcome }
  | { type: 'END_RUN' };

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getLocationDisplayName(location: TrailLocation): string {
  const MAP: Record<TrailLocation, string> = {
    independence_mo: 'Independence, Missouri',
    fort_kearney:    'Fort Kearney',
    chimney_rock:    'Chimney Rock',
    fort_laramie:    'Fort Laramie',
    south_pass:      'South Pass',
    fort_bridger:    'Fort Bridger',
    fort_hall:       'Fort Hall',
    fort_boise:      'Fort Boise',
    the_dalles:      'The Dalles',
    oregon_city:     'Oregon City',
  };
  return MAP[location] ?? location;
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
        milesUntilNextStop: 200,
        totalMilesTraveled: 0,
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

      // Miles traveled today
      const milesToday = MILES_PER_DAY[action.pace];
      const newMilesUntilNextStop = Math.max(0, state.milesUntilNextStop - milesToday);
      const newTotalMilesTraveled = state.totalMilesTraveled + milesToday;

      // Starvation damage: if food or water hit 0, all alive members lose 5 health
      const isStarving = newResources.food <= 0 || newResources.water <= 0;

      // Update party: apply starvation damage, then check for deaths
      const newParty = state.party.map((m) => {
        if (!m.isAlive) return m;
        const newHealth = isStarving ? m.health - 5 : m.health;
        if (newHealth <= 0) {
          return { ...m, health: 0, isAlive: false };
        }
        return { ...m, health: newHealth };
      });

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
        party: newParty,
        milesUntilNextStop: newMilesUntilNextStop,
        totalMilesTraveled: newTotalMilesTraveled,
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

    case 'ADD_PARTY_MEMBERS': {
      const newMembers: PartyMember[] = action.members.map((c) => ({
        ...c,
        health: 100,
        isAlive: true,
        joinedOnDay: state.day,
      }));

      // Expand relationship matrix to include new members
      const newMatrix = { ...state.relationshipMatrix };
      const allIds = [...state.party.map((m) => m.id), ...newMembers.map((m) => m.id)];
      for (const id of newMembers.map((m) => m.id)) {
        newMatrix[id] = {};
        for (const otherId of allIds) {
          if (otherId !== id) {
            newMatrix[id][otherId] = 0;
            if (newMatrix[otherId]) newMatrix[otherId][id] = 0;
          }
        }
      }

      return {
        ...state,
        party: [...state.party, ...newMembers],
        relationshipMatrix: newMatrix,
      };
    }

    case 'ADVANCE_LOCATION': {
      const currentIndex = TRAIL_WAYPOINTS.indexOf(state.location);
      if (currentIndex === -1 || currentIndex === TRAIL_WAYPOINTS.length - 1) return state;
      const nextLoc = TRAIL_WAYPOINTS[currentIndex + 1];
      // Set miles for the NEXT leg (from nextLoc to the one after it)
      const nextNextIndex = currentIndex + 2;
      const nextMiles = nextNextIndex < TRAIL_WAYPOINTS.length
        ? getMilesBetween(nextLoc, TRAIL_WAYPOINTS[nextNextIndex])
        : 0;
      return { ...state, location: nextLoc, milesUntilNextStop: nextMiles };
    }

    case 'APPLY_EVENT_OUTCOME': {
      const { outcome } = action;
      let newState = { ...state };

      // Apply resource changes (deltas)
      if (outcome.resourceChanges) {
        const res = { ...state.resources, wagonParts: { ...state.resources.wagonParts } };

        for (const [key, value] of Object.entries(outcome.resourceChanges)) {
          if (key === 'wagonParts' && typeof value === 'object' && value !== null) {
            const parts = value as Partial<ResourceState['wagonParts']>;
            if (parts.wheels !== undefined) res.wagonParts.wheels += parts.wheels;
            if (parts.axles !== undefined) res.wagonParts.axles += parts.axles;
            if (parts.tongues !== undefined) res.wagonParts.tongues += parts.tongues;
          } else if (key !== 'wagonParts') {
            (res as Record<string, unknown>)[key] =
              ((res as Record<string, unknown>)[key] as number) + (value as number);
          }
        }

        // Clamp values
        res.oxenHealth = clamp(res.oxenHealth, 0, 100);
        res.wagonHealth = clamp(res.wagonHealth, 0, 100);
        res.food = Math.max(0, res.food);
        res.water = Math.max(0, res.water);
        res.ammunition = Math.max(0, res.ammunition);
        res.medicine = Math.max(0, res.medicine);
        res.money = Math.max(0, res.money);
        res.wagonParts.wheels = Math.max(0, res.wagonParts.wheels);
        res.wagonParts.axles = Math.max(0, res.wagonParts.axles);
        res.wagonParts.tongues = Math.max(0, res.wagonParts.tongues);

        newState.resources = res;
        newState.money = res.money;
      }

      // Apply health changes (deltas) and check for deaths
      if (outcome.healthChanges) {
        const partyUpdated = newState.party.map((m) => {
          const change = outcome.healthChanges!.find((h) => h.characterId === m.id);
          if (!change || !m.isAlive) return m;
          const newHealth = clamp(m.health + change.delta, 0, 100);
          if (newHealth <= 0) {
            return { ...m, health: 0, isAlive: false };
          }
          return { ...m, health: newHealth };
        });
        newState.party = partyUpdated;
      }

      // Apply relationship deltas (vs player — characterA is always the player's first party member)
      if (outcome.relationshipDeltas) {
        const playerId = state.party[0]?.id;
        if (playerId) {
          const matrix = { ...newState.relationshipMatrix };
          for (const [charId, delta] of Object.entries(outcome.relationshipDeltas)) {
            if (!matrix[playerId]) matrix[playerId] = {};
            if (!matrix[charId]) matrix[charId] = {};
            matrix[playerId] = {
              ...matrix[playerId],
              [charId]: clamp((matrix[playerId][charId] ?? 0) + delta, -100, 100),
            };
            matrix[charId] = {
              ...matrix[charId],
              [playerId]: clamp((matrix[charId][playerId] ?? 0) + delta, -100, 100),
            };
          }
          newState.relationshipMatrix = matrix;
        }
      }

      // Apply new flags
      if (outcome.newFlags) {
        const flags = [...newState.flags];
        for (const flag of outcome.newFlags) {
          if (!flags.includes(flag)) flags.push(flag);
        }
        newState.flags = flags;
      }

      return newState;
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
    milesUntilNextStop: 200,
    totalMilesTraveled: 0,
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
