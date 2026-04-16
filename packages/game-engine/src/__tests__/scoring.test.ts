import { describe, it, expect } from 'vitest';
import { computeScore, getEpilogue } from '../scoring';
import { gameReducer, DEFAULT_RESOURCES, DEFAULT_HIDDEN_STATE, DEFAULT_RUN_MEMORY } from '../state';
import type { GameState } from '../state';
import type { Character } from '@whoreagon-trail/characters';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function freshState(charCount = 4): GameState {
  const chars = Array.from({ length: charCount }, (_, i) => makeChar(`char${i}`));
  return gameReducer({} as GameState, { type: 'START_RUN', party: chars });
}

// ── computeScore ──────────────────────────────────────────────────────────────

describe('computeScore', () => {
  it('returns S for a perfect run (all alive, full resources, high protection, low resentment)', () => {
    const state: GameState = {
      ...freshState(4),
      resources: {
        ...DEFAULT_RESOURCES,
        food: 200,
        water: 20,
        money: 200,
        oxenHealth: 100,
        wagonHealth: 100,
      },
      hiddenState: {
        ...DEFAULT_HIDDEN_STATE,
        protection: 100,
        resentment: 0,
      },
    };

    const score = computeScore(state);
    expect(score.grade).toBe('S');
    expect(score.final).toBeGreaterThanOrEqual(80);
    expect(score.survivors).toBe(4);
    expect(score.totalParty).toBe(4);
    expect(score.survivalRate).toBe(100);
  });

  it('returns D when all party members are dead', () => {
    const base = freshState(4);
    const state: GameState = {
      ...base,
      party: base.party.map(m => ({ ...m, isAlive: false, health: 0 })),
      resources: {
        ...DEFAULT_RESOURCES,
        food: 0,
        water: 0,
        money: 0,
        oxenHealth: 0,
        wagonHealth: 0,
      },
      hiddenState: {
        ...DEFAULT_HIDDEN_STATE,
        protection: 0,
        resentment: 100,
      },
    };

    const score = computeScore(state);
    expect(score.grade).toBe('D');
    expect(score.survivors).toBe(0);
    expect(score.survivalRate).toBe(0);
    expect(score.final).toBeLessThan(35);
  });

  it('final score is clamped to 0–100', () => {
    // Extreme resentment with some survivors
    const base = freshState(2);
    const state: GameState = {
      ...base,
      hiddenState: { ...DEFAULT_HIDDEN_STATE, protection: 0, resentment: 100 },
    };
    const score = computeScore(state);
    expect(score.final).toBeGreaterThanOrEqual(0);
    expect(score.final).toBeLessThanOrEqual(100);
  });

  it('calculates survival rate correctly for partial survival', () => {
    const base = freshState(4);
    const state: GameState = {
      ...base,
      party: base.party.map((m, i) => ({ ...m, isAlive: i < 2 })),
    };
    const score = computeScore(state);
    expect(score.survivors).toBe(2);
    expect(score.totalParty).toBe(4);
    expect(score.survivalRate).toBe(50);
  });

  it('resourceScore caps at 100 even with excess resources', () => {
    const base = freshState(2);
    const state: GameState = {
      ...base,
      resources: {
        ...DEFAULT_RESOURCES,
        food: 9999,
        water: 9999,
        money: 9999,
        oxenHealth: 100,
        wagonHealth: 100,
      },
    };
    const score = computeScore(state);
    expect(score.resourceScore).toBeLessThanOrEqual(100);
  });

  it('higher protection improves grade vs same run with lower protection', () => {
    const base = freshState(4);
    const lowProtection = computeScore({
      ...base,
      hiddenState: { ...DEFAULT_HIDDEN_STATE, protection: 20, resentment: 20 },
    });
    const highProtection = computeScore({
      ...base,
      hiddenState: { ...DEFAULT_HIDDEN_STATE, protection: 80, resentment: 20 },
    });
    expect(highProtection.final).toBeGreaterThan(lowProtection.final);
  });
});

// ── getEpilogue ───────────────────────────────────────────────────────────────

describe('getEpilogue', () => {
  it('returns a non-empty string for all grades', () => {
    const base = freshState(2);
    const grades = ['S', 'A', 'B', 'C', 'D'] as const;
    for (const grade of grades) {
      const score = { survivors: 2, totalParty: 2, survivalRate: 100, resourceScore: 80, protectionScore: 80, resentmentPenalty: 20, final: 80, grade };
      const text = getEpilogue(base, score);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('mentions total loss when all party members died', () => {
    const base = freshState(3);
    const score = { survivors: 0, totalParty: 3, survivalRate: 0, resourceScore: 0, protectionScore: 0, resentmentPenalty: 100, final: 0, grade: 'D' as const };
    const text = getEpilogue(base, score);
    expect(text).toMatch(/3 people did not arrive/);
  });

  it('acknowledges when everyone survived', () => {
    const base = freshState(3);
    const score = { survivors: 3, totalParty: 3, survivalRate: 100, resourceScore: 80, protectionScore: 80, resentmentPenalty: 20, final: 85, grade: 'A' as const };
    const text = getEpilogue(base, score);
    expect(text).toMatch(/Everyone made it/);
  });

  it('uses route-specific text for fort_route', () => {
    const base = freshState(2);
    const fortRoute = { type: 'fort_route' as const, chosenOnDay: 1, gatekeeperIntensity: 'high' as const, exposureLevel: 'low' as const, socialCost: 'low' as const };
    const state: GameState = { ...base, route: fortRoute };
    const score = { survivors: 2, totalParty: 2, survivalRate: 100, resourceScore: 80, protectionScore: 80, resentmentPenalty: 20, final: 82, grade: 'S' as const };
    const text = getEpilogue(state, score);
    expect(text).toMatch(/fort/i);
  });

  it('uses route-specific text for entertainment_circuit', () => {
    const base = freshState(2);
    const circuitRoute = { type: 'entertainment_circuit' as const, chosenOnDay: 1, gatekeeperIntensity: 'high' as const, exposureLevel: 'high' as const, socialCost: 'high' as const };
    const state: GameState = { ...base, route: circuitRoute };
    const score = { survivors: 2, totalParty: 2, survivalRate: 100, resourceScore: 80, protectionScore: 80, resentmentPenalty: 20, final: 60, grade: 'B' as const };
    const text = getEpilogue(state, score);
    expect(text).toMatch(/circuit/i);
  });
});
