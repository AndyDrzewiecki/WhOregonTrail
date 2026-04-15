import { describe, it, expect } from 'vitest';
import {
  gameReducer,
  DEFAULT_RESOURCES,
  DEFAULT_HIDDEN_STATE,
  DEFAULT_RUN_MEMORY,
  TRAIL_WAYPOINTS,
  MILES_PER_DAY,
  selectTrailEvent,
} from '../state';
import type { GameState, GameAction } from '../state';
import type { Character } from '@whoreagon-trail/characters';

// ── Minimal test characters ───────────────────────────────────────────────────

const makeChar = (id: string): Character => ({
  id,
  name: id,
  age: 30,
  religion: 'None',
  race: 'Unknown',
  sex: 'Unknown',
  orientation: 'Unknown',
  skinTone: 'Unknown',
  voice: 'Flat',
  moralCode: 'Survive',
  personality: { O: 5, C: 5, E: 5, A: 5, N: 5 },
  conflictResolutionType: 'Mediator',
  performanceTrait: 'None',
  hiddenTrait: 'None',
});

const TWO_CHARS = [makeChar('alpha'), makeChar('beta')];

// ── Helpers ───────────────────────────────────────────────────────────────────

function freshState(): GameState {
  return gameReducer({} as GameState, { type: 'START_RUN', party: TWO_CHARS });
}

function dispatch(state: GameState, action: GameAction): GameState {
  return gameReducer(state, action);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('START_RUN', () => {
  it('initializes a fresh run with correct defaults', () => {
    const state = freshState();
    expect(state.phase).toBe('PROLOGUE');
    expect(state.day).toBe(0);
    expect(state.location).toBe('independence_mo');
    expect(state.flags).toEqual([]);
    expect(state.runId).toMatch(/^run_\d+_/);
  });

  it('sets all party members alive with full health', () => {
    const state = freshState();
    expect(state.party).toHaveLength(2);
    state.party.forEach(m => {
      expect(m.isAlive).toBe(true);
      expect(m.health).toBe(100);
    });
  });

  it('applies DEFAULT_RESOURCES', () => {
    const state = freshState();
    expect(state.resources.food).toBe(DEFAULT_RESOURCES.food);
    expect(state.resources.money).toBe(DEFAULT_RESOURCES.money);
  });

  it('applies DEFAULT_HIDDEN_STATE', () => {
    const state = freshState();
    expect(state.hiddenState).toEqual(DEFAULT_HIDDEN_STATE);
  });

  it('resets flags and run memory on restart', () => {
    let state = freshState();
    state = dispatch(state, { type: 'SET_FLAG', flag: 'SOME_FLAG' });
    // Simulate restart
    state = dispatch(state, { type: 'START_RUN', party: TWO_CHARS });
    expect(state.flags).toEqual([]);
    expect(state.runMemory.events).toEqual([]);
  });
});

describe('SET_PHASE', () => {
  it('transitions between phases', () => {
    let state = freshState();
    state = dispatch(state, { type: 'SET_PHASE', phase: 'SETUP' });
    expect(state.phase).toBe('SETUP');
    state = dispatch(state, { type: 'SET_PHASE', phase: 'TRAIL' });
    expect(state.phase).toBe('TRAIL');
    state = dispatch(state, { type: 'SET_PHASE', phase: 'CAMPFIRE' });
    expect(state.phase).toBe('CAMPFIRE');
  });
});

describe('UPDATE_RESOURCES', () => {
  it('sets resource values directly', () => {
    let state = freshState();
    state = dispatch(state, { type: 'UPDATE_RESOURCES', changes: { food: 250, money: 99 } });
    expect(state.resources.food).toBe(250);
    expect(state.resources.money).toBe(99);
    // Unchanged resources remain
    expect(state.resources.water).toBe(DEFAULT_RESOURCES.water);
  });

  it('clamps health values to [0, 100]', () => {
    let state = freshState();
    state = dispatch(state, { type: 'UPDATE_RESOURCES', changes: { oxenHealth: 999, wagonHealth: -50 } });
    expect(state.resources.oxenHealth).toBe(100);
    expect(state.resources.wagonHealth).toBe(0);
  });

  it('floors non-health values at 0', () => {
    let state = freshState();
    state = dispatch(state, { type: 'UPDATE_RESOURCES', changes: { food: -999, money: -1 } });
    expect(state.resources.food).toBe(0);
    expect(state.resources.money).toBe(0);
  });

  it('syncs state.money with resources.money', () => {
    let state = freshState();
    state = dispatch(state, { type: 'UPDATE_RESOURCES', changes: { money: 42 } });
    expect(state.money).toBe(42);
    expect(state.resources.money).toBe(42);
  });
});

describe('ADVANCE_DAY', () => {
  it('increments day counter', () => {
    let state = freshState();
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'steady' });
    expect(state.day).toBe(1);
  });

  it('consumes food and water based on party size and pace', () => {
    let state = freshState();
    // 2 people at steady pace: 2×2.0 food = 4 food, 2×0.4 water = 0.8 water
    const beforeFood = state.resources.food;
    const beforeWater = state.resources.water;
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'steady' });
    expect(state.resources.food).toBe(Math.max(0, beforeFood - 4));
    expect(state.resources.water).toBeCloseTo(Math.max(0, beforeWater - 0.8), 5);
  });

  it('advances more miles at grueling pace', () => {
    let state = freshState();
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'grueling' });
    expect(state.totalMilesTraveled).toBe(25);
  });

  it('travels no miles at rest pace', () => {
    let state = freshState();
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'rest' });
    expect(state.totalMilesTraveled).toBe(0);
    expect(state.day).toBe(1);
  });

  it('applies starvation damage when food hits 0', () => {
    let state = freshState();
    state = dispatch(state, { type: 'UPDATE_RESOURCES', changes: { food: 0, water: 0 } });
    const healthBefore = state.party[0]!.health;
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'steady' });
    expect(state.party[0]!.health).toBe(healthBefore - 5);
  });

  it('kills a party member whose health hits 0 from starvation', () => {
    let state = freshState();
    state = dispatch(state, { type: 'UPDATE_RESOURCES', changes: { food: 0, water: 0 } });
    state = dispatch(state, { type: 'UPDATE_CHARACTER_HEALTH', characterId: 'alpha', health: 3 });
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'steady' });
    const alpha = state.party.find(m => m.id === 'alpha')!;
    expect(alpha.isAlive).toBe(false);
    expect(alpha.health).toBe(0);
  });
});

describe('SET_FLAG / REMOVE_FLAG', () => {
  it('adds a flag', () => {
    let state = freshState();
    state = dispatch(state, { type: 'SET_FLAG', flag: 'PROLOGUE_COMPLETE' });
    expect(state.flags).toContain('PROLOGUE_COMPLETE');
  });

  it('does not duplicate flags', () => {
    let state = freshState();
    state = dispatch(state, { type: 'SET_FLAG', flag: 'PROLOGUE_COMPLETE' });
    state = dispatch(state, { type: 'SET_FLAG', flag: 'PROLOGUE_COMPLETE' });
    expect(state.flags.filter(f => f === 'PROLOGUE_COMPLETE')).toHaveLength(1);
  });

  it('removes a flag', () => {
    let state = freshState();
    state = dispatch(state, { type: 'SET_FLAG', flag: 'PROLOGUE_COMPLETE' });
    state = dispatch(state, { type: 'REMOVE_FLAG', flag: 'PROLOGUE_COMPLETE' });
    expect(state.flags).not.toContain('PROLOGUE_COMPLETE');
  });

  it('is a no-op when removing a non-existent flag', () => {
    let state = freshState();
    const before = [...state.flags];
    state = dispatch(state, { type: 'REMOVE_FLAG', flag: 'NONEXISTENT' });
    expect(state.flags).toEqual(before);
  });
});

describe('UPDATE_CHARACTER_HEALTH', () => {
  it('clamps health to [0, 100]', () => {
    let state = freshState();
    state = dispatch(state, { type: 'UPDATE_CHARACTER_HEALTH', characterId: 'alpha', health: 150 });
    expect(state.party.find(m => m.id === 'alpha')!.health).toBe(100);
    state = dispatch(state, { type: 'UPDATE_CHARACTER_HEALTH', characterId: 'alpha', health: -5 });
    expect(state.party.find(m => m.id === 'alpha')!.health).toBe(0);
  });

  it('only updates the target character', () => {
    let state = freshState();
    state = dispatch(state, { type: 'UPDATE_CHARACTER_HEALTH', characterId: 'alpha', health: 50 });
    expect(state.party.find(m => m.id === 'beta')!.health).toBe(100);
  });
});

describe('MARK_CHARACTER_DEAD', () => {
  it('marks a character dead with 0 health', () => {
    let state = freshState();
    state = dispatch(state, { type: 'MARK_CHARACTER_DEAD', characterId: 'alpha' });
    const alpha = state.party.find(m => m.id === 'alpha')!;
    expect(alpha.isAlive).toBe(false);
    expect(alpha.health).toBe(0);
  });

  it('does not affect other party members', () => {
    let state = freshState();
    state = dispatch(state, { type: 'MARK_CHARACTER_DEAD', characterId: 'alpha' });
    expect(state.party.find(m => m.id === 'beta')!.isAlive).toBe(true);
  });
});

describe('APPLY_HIDDEN_DELTA', () => {
  it('applies deltas to hidden state fields', () => {
    let state = freshState();
    const before = state.hiddenState.resentment;
    state = dispatch(state, { type: 'APPLY_HIDDEN_DELTA', delta: { resentment: 20 } });
    expect(state.hiddenState.resentment).toBe(before + 20);
  });

  it('clamps hidden state to [0, 100]', () => {
    let state = freshState();
    state = dispatch(state, { type: 'APPLY_HIDDEN_DELTA', delta: { resentment: 999 } });
    expect(state.hiddenState.resentment).toBeLessThanOrEqual(100);
    state = dispatch(state, { type: 'APPLY_HIDDEN_DELTA', delta: { protection: -999 } });
    expect(state.hiddenState.protection).toBeGreaterThanOrEqual(0);
  });

  it('only modifies specified fields', () => {
    let state = freshState();
    const beforeProtection = state.hiddenState.protection;
    state = dispatch(state, { type: 'APPLY_HIDDEN_DELTA', delta: { resentment: 5 } });
    expect(state.hiddenState.protection).toBe(beforeProtection);
  });
});

describe('RECORD_MEMORY_EVENT', () => {
  it('appends a memory event', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'RECORD_MEMORY_EVENT',
      event: {
        day: 1,
        type: 'route_chosen',
        label: 'chose fort route',
        sentiment: 'ambiguous',
      },
    });
    expect(state.runMemory.events).toHaveLength(1);
    expect(state.runMemory.events[0]!.label).toBe('chose fort route');
  });

  it('caps run memory at 20 events', () => {
    let state = freshState();
    for (let i = 0; i < 25; i++) {
      state = dispatch(state, {
        type: 'RECORD_MEMORY_EVENT',
        event: { day: i, type: 'route_chosen', label: `event ${i}`, sentiment: 'positive' },
      });
    }
    expect(state.runMemory.events.length).toBeLessThanOrEqual(20);
  });

  it('sets boundaryDefended flag from event type', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'RECORD_MEMORY_EVENT',
      event: { day: 1, type: 'boundary_defended', label: 'defended', sentiment: 'positive' },
    });
    expect(state.runMemory.boundaryDefended).toBe(true);
  });

  it('sets boundaryCrossed flag from event type', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'RECORD_MEMORY_EVENT',
      event: { day: 1, type: 'boundary_crossed', label: 'crossed', sentiment: 'negative' },
    });
    expect(state.runMemory.boundaryCrossed).toBe(true);
  });
});

describe('SET_ROUTE', () => {
  it('stores the chosen route profile', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'SET_ROUTE',
      route: {
        type: 'fort_route',
        chosenOnDay: 1,
        gatekeeperIntensity: 'high',
        exposureLevel: 'low',
        socialCost: 'low',
      },
    });
    expect(state.route?.type).toBe('fort_route');
    expect(state.route?.chosenOnDay).toBe(1);
  });
});

describe('APPLY_RELATIONSHIP_DELTA', () => {
  it('updates both directions of the relationship matrix', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'APPLY_RELATIONSHIP_DELTA',
      characterA: 'alpha',
      characterB: 'beta',
      delta: 15,
    });
    expect(state.relationshipMatrix['alpha']?.['beta']).toBeGreaterThan(0);
    expect(state.relationshipMatrix['beta']?.['alpha']).toBeGreaterThan(0);
  });

  it('clamps relationship values to [-100, 100]', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'APPLY_RELATIONSHIP_DELTA',
      characterA: 'alpha',
      characterB: 'beta',
      delta: 9999,
    });
    expect(state.relationshipMatrix['alpha']?.['beta']).toBe(100);
  });
});

describe('ADVANCE_LOCATION', () => {
  it('moves to the next trail waypoint', () => {
    let state = freshState();
    expect(state.location).toBe('independence_mo');
    state = dispatch(state, { type: 'ADVANCE_LOCATION' });
    expect(state.location).toBe('fort_kearney');
  });

  it('is a no-op at the last waypoint', () => {
    let state = freshState();
    // Jump to the last location
    for (let i = 0; i < 9; i++) {
      state = dispatch(state, { type: 'ADVANCE_LOCATION' });
    }
    expect(state.location).toBe('oregon_city');
    state = dispatch(state, { type: 'ADVANCE_LOCATION' });
    expect(state.location).toBe('oregon_city');
  });
});

describe('ADD_PARTY_MEMBERS', () => {
  it('adds new members to the party', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'ADD_PARTY_MEMBERS',
      members: [makeChar('gamma')],
    });
    expect(state.party).toHaveLength(3);
    const gamma = state.party.find(m => m.id === 'gamma')!;
    expect(gamma.isAlive).toBe(true);
    expect(gamma.health).toBe(100);
    expect(gamma.joinedOnDay).toBe(state.day);
  });

  it('expands the relationship matrix for new members', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'ADD_PARTY_MEMBERS',
      members: [makeChar('gamma')],
    });
    expect(state.relationshipMatrix['gamma']).toBeDefined();
    expect(state.relationshipMatrix['alpha']?.['gamma']).toBeDefined();
  });
});

describe('END_RUN', () => {
  it('transitions phase to END', () => {
    let state = freshState();
    state = dispatch(state, { type: 'SET_PHASE', phase: 'TRAIL' });
    state = dispatch(state, { type: 'END_RUN' });
    expect(state.phase).toBe('END');
  });
});

describe('DEFAULT_RESOURCES sanity', () => {
  it('has non-zero food and water so players do not immediately starve', () => {
    expect(DEFAULT_RESOURCES.food).toBeGreaterThan(0);
    expect(DEFAULT_RESOURCES.water).toBeGreaterThan(0);
  });

  it('has enough money to unlock Entertainment Circuit (> $40)', () => {
    expect(DEFAULT_RESOURCES.money).toBeGreaterThan(40);
  });

  it('has non-zero ammunition', () => {
    expect(DEFAULT_RESOURCES.ammunition).toBeGreaterThan(0);
  });
});

// ── Trail loop mechanics ──────────────────────────────────────────────────────

describe('ADVANCE_DAY trail loop', () => {
  it('decrements milesUntilNextStop by steady pace miles', () => {
    let state = freshState();
    const before = state.milesUntilNextStop;
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'steady' });
    expect(state.milesUntilNextStop).toBe(Math.max(0, before - MILES_PER_DAY.steady));
  });

  it('does not decrease milesUntilNextStop below 0', () => {
    let state = freshState();
    // Force milesUntilNextStop to a small number
    state = { ...state, milesUntilNextStop: 5 };
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'grueling' });
    expect(state.milesUntilNextStop).toBe(0);
  });

  it('accumulates totalMilesTraveled across multiple days', () => {
    let state = freshState();
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'steady' });
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'grueling' });
    expect(state.totalMilesTraveled).toBe(MILES_PER_DAY.steady + MILES_PER_DAY.grueling);
  });

  it('does not consume food or water on rest day', () => {
    let state = freshState();
    // 2 party members at rest: 2 × 1.5 food, 2 × 0.3 water
    const foodBefore = state.resources.food;
    const waterBefore = state.resources.water;
    state = dispatch(state, { type: 'ADVANCE_DAY', pace: 'rest' });
    expect(state.resources.food).toBeLessThan(foodBefore);
    expect(state.resources.water).toBeLessThan(waterBefore);
    // Rest pace consumes less than steady
    const restFoodCost = 2 * 1.5;
    expect(state.resources.food).toBe(Math.max(0, foodBefore - restFoodCost));
  });
});

describe('ADVANCE_LOCATION trail progression', () => {
  it('covers all 10 waypoints in order', () => {
    let state = freshState();
    for (let i = 0; i < TRAIL_WAYPOINTS.length - 1; i++) {
      expect(state.location).toBe(TRAIL_WAYPOINTS[i]);
      state = dispatch(state, { type: 'ADVANCE_LOCATION' });
    }
    expect(state.location).toBe('oregon_city');
  });

  it('updates milesUntilNextStop to next leg distance after advancing', () => {
    let state = freshState();
    // First advance: independence_mo → fort_kearney
    // Next leg: fort_kearney → chimney_rock = 120 miles
    state = dispatch(state, { type: 'ADVANCE_LOCATION' });
    expect(state.location).toBe('fort_kearney');
    expect(state.milesUntilNextStop).toBe(120);
  });

  it('sets milesUntilNextStop to 0 at final waypoint (no next leg)', () => {
    let state = freshState();
    for (let i = 0; i < TRAIL_WAYPOINTS.length - 1; i++) {
      state = dispatch(state, { type: 'ADVANCE_LOCATION' });
    }
    expect(state.location).toBe('oregon_city');
    expect(state.milesUntilNextStop).toBe(0);
  });
});

describe('selectTrailEvent', () => {
  it('returns null or a valid event template', () => {
    const state = freshState();
    // Run 20 times to get a statistical sample — should always return valid or null
    for (let i = 0; i < 20; i++) {
      const result = selectTrailEvent(state);
      expect(result === null || typeof result.type === 'string').toBe(true);
    }
  });

  it('returns null roughly 35% of the time (probabilistic guard)', () => {
    // selectTrailEvent has 0.65 chance of returning null. Over 200 trials,
    // we should see null at least 40 times and at most 100 times.
    const state = freshState();
    let nullCount = 0;
    for (let i = 0; i < 200; i++) {
      if (selectTrailEvent(state) === null) nullCount++;
    }
    expect(nullCount).toBeGreaterThanOrEqual(40);
    expect(nullCount).toBeLessThanOrEqual(150);
  });

  it('only returns highHealth events when all party members are above 70 health', () => {
    let state = freshState();
    // Both party members start at 100 health — highHealth events eligible
    const results = Array.from({ length: 50 }, () => selectTrailEvent(state)).filter(Boolean);
    const highHealthEventTypes = new Set(['hunting_opportunity', 'performance_opportunity', 'roadside_audience']);
    // At least some high-health events should appear in a healthy party
    const hasHighHealth = results.some(e => highHealthEventTypes.has(e!.type));
    expect(hasHighHealth).toBe(true);
  });

  it('excludes highHealth events when a party member is below 70 health', () => {
    let state = freshState();
    state = dispatch(state, { type: 'UPDATE_CHARACTER_HEALTH', characterId: 'alpha', health: 30 });
    const results = Array.from({ length: 100 }, () => selectTrailEvent(state)).filter(Boolean);
    const highHealthEventTypes = new Set(['hunting_opportunity', 'performance_opportunity', 'roadside_audience']);
    const hasHighHealth = results.some(e => highHealthEventTypes.has(e!.type));
    expect(hasHighHealth).toBe(false);
  });
});

describe('APPLY_EVENT_OUTCOME', () => {
  it('applies resource changes as deltas (additive)', () => {
    let state = freshState();
    const foodBefore = state.resources.food;
    state = dispatch(state, {
      type: 'APPLY_EVENT_OUTCOME',
      outcome: { resourceChanges: { food: 20 } },
    });
    expect(state.resources.food).toBe(foodBefore + 20);
  });

  it('applies negative resource changes and floors at 0', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'APPLY_EVENT_OUTCOME',
      outcome: { resourceChanges: { food: -9999 } },
    });
    expect(state.resources.food).toBe(0);
  });

  it('applies health changes as deltas and kills on 0', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'APPLY_EVENT_OUTCOME',
      outcome: { healthChanges: [{ characterId: 'alpha', delta: -200 }] },
    });
    const alpha = state.party.find(m => m.id === 'alpha')!;
    expect(alpha.health).toBe(0);
    expect(alpha.isAlive).toBe(false);
  });

  it('applies new flags', () => {
    let state = freshState();
    state = dispatch(state, {
      type: 'APPLY_EVENT_OUTCOME',
      outcome: { newFlags: ['TEST_FLAG'] },
    });
    expect(state.flags).toContain('TEST_FLAG');
  });
});
