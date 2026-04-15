import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listSaveSlots,
  saveToSlot,
  loadSlot,
  deleteSlot,
  getActiveSlot,
  setActiveSlot,
  clearActiveSlot,
  SLOT_COUNT,
  type SlotId,
} from '../saveSlots';
import type { StorageAdapter } from '../storage';
import { gameReducer } from '../state';
import type { GameState } from '../state';
import type { Character } from '@whoreagon-trail/characters';

// ── Minimal test helpers ─────────────────────────────────────────────────────

function makeChar(id: string): Character {
  return {
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
  };
}

function freshState(): GameState {
  return gameReducer({} as GameState, {
    type: 'START_RUN',
    party: [makeChar('alpha'), makeChar('beta')],
  });
}

// ── In-memory StorageAdapter for tests ───────────────────────────────────────

function makeMemoryAdapter(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => { store.set(key, value); },
    removeItem: async (key) => { store.delete(key); },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SLOT_COUNT', () => {
  it('is 3', () => {
    expect(SLOT_COUNT).toBe(3);
  });
});

describe('listSaveSlots', () => {
  it('returns [null, null, null] when storage is empty', async () => {
    const adapter = makeMemoryAdapter();
    const slots = await listSaveSlots(adapter);
    expect(slots).toHaveLength(3);
    expect(slots).toEqual([null, null, null]);
  });

  it('returns metadata for populated slots, null for empty', async () => {
    const adapter = makeMemoryAdapter();
    const state = freshState();
    await saveToSlot(adapter, 1, state, 'Independence, Missouri');

    const slots = await listSaveSlots(adapter);
    expect(slots[0]).toBeNull();
    expect(slots[1]).not.toBeNull();
    expect(slots[1]!.slotId).toBe(1);
    expect(slots[1]!.locationName).toBe('Independence, Missouri');
    expect(slots[2]).toBeNull();
  });
});

describe('saveToSlot', () => {
  it('writes state and metadata', async () => {
    const adapter = makeMemoryAdapter();
    const state = freshState();
    await saveToSlot(adapter, 0, state, 'Fort Kearney');

    const slots = await listSaveSlots(adapter);
    const meta = slots[0]!;
    expect(meta.slotId).toBe(0);
    expect(meta.runId).toBe(state.runId);
    expect(meta.day).toBe(state.day);
    expect(meta.location).toBe(state.location);
    expect(meta.locationName).toBe('Fort Kearney');
    expect(meta.savedAt).toBeGreaterThan(0);
  });

  it('includes alive party member names (up to 4)', async () => {
    const adapter = makeMemoryAdapter();
    const state = freshState(); // 2 alive members: alpha, beta
    await saveToSlot(adapter, 0, state, 'Independence, Missouri');

    const slots = await listSaveSlots(adapter);
    expect(slots[0]!.partyNames).toContain('alpha');
    expect(slots[0]!.partyNames).toContain('beta');
    expect(slots[0]!.partyNames).toHaveLength(2);
  });

  it('caps party names at 4', async () => {
    const adapter = makeMemoryAdapter();
    const manyChars = ['a', 'b', 'c', 'd', 'e', 'f'].map(makeChar);
    const state = gameReducer({} as GameState, { type: 'START_RUN', party: manyChars });
    await saveToSlot(adapter, 2, state, 'South Pass');

    const slots = await listSaveSlots(adapter);
    expect(slots[2]!.partyNames).toHaveLength(4);
  });

  it('records routeType when route is set', async () => {
    const adapter = makeMemoryAdapter();
    let state = freshState();
    state = gameReducer(state, {
      type: 'SET_ROUTE',
      route: {
        type: 'fort_route',
        chosenOnDay: 1,
        gatekeeperIntensity: 'high',
        exposureLevel: 'low',
        socialCost: 'low',
      },
    });
    await saveToSlot(adapter, 0, state, 'Fort Laramie');

    const slots = await listSaveSlots(adapter);
    expect(slots[0]!.routeType).toBe('fort_route');
  });

  it('records null routeType when no route selected', async () => {
    const adapter = makeMemoryAdapter();
    const state = freshState(); // route is null
    await saveToSlot(adapter, 0, state, 'Independence, Missouri');

    const slots = await listSaveSlots(adapter);
    expect(slots[0]!.routeType).toBeNull();
  });
});

describe('loadSlot', () => {
  it('returns null for empty slot', async () => {
    const adapter = makeMemoryAdapter();
    const result = await loadSlot(adapter, 0);
    expect(result).toBeNull();
  });

  it('returns the saved GameState', async () => {
    const adapter = makeMemoryAdapter();
    const state = freshState();
    await saveToSlot(adapter, 0, state, 'Independence, Missouri');

    const loaded = await loadSlot(adapter, 0);
    expect(loaded).not.toBeNull();
    expect(loaded!.runId).toBe(state.runId);
    expect(loaded!.day).toBe(state.day);
    expect(loaded!.party).toHaveLength(2);
  });

  it('returns null if slot data is corrupt JSON', async () => {
    const adapter = makeMemoryAdapter();
    // Manually write corrupt data
    await adapter.setItem('game:slot:1', 'NOT_VALID_JSON{{{');
    const result = await loadSlot(adapter, 1);
    expect(result).toBeNull();
  });
});

describe('deleteSlot', () => {
  it('removes both data and metadata', async () => {
    const adapter = makeMemoryAdapter();
    const state = freshState();
    await saveToSlot(adapter, 1, state, 'Fort Bridger');

    // Confirm it exists
    expect(await loadSlot(adapter, 1)).not.toBeNull();

    await deleteSlot(adapter, 1);

    expect(await loadSlot(adapter, 1)).toBeNull();
    const slots = await listSaveSlots(adapter);
    expect(slots[1]).toBeNull();
  });

  it('is a no-op for already empty slots', async () => {
    const adapter = makeMemoryAdapter();
    // Should not throw
    await expect(deleteSlot(adapter, 2)).resolves.toBeUndefined();
  });
});

describe('active slot management', () => {
  it('returns null when no active slot is set', async () => {
    const adapter = makeMemoryAdapter();
    const result = await getActiveSlot(adapter);
    expect(result).toBeNull();
  });

  it('sets and retrieves an active slot', async () => {
    const adapter = makeMemoryAdapter();
    await setActiveSlot(adapter, 2);
    const result = await getActiveSlot(adapter);
    expect(result).toBe(2);
  });

  it('updates active slot', async () => {
    const adapter = makeMemoryAdapter();
    await setActiveSlot(adapter, 0);
    await setActiveSlot(adapter, 1);
    expect(await getActiveSlot(adapter)).toBe(1);
  });

  it('clearActiveSlot removes the active slot', async () => {
    const adapter = makeMemoryAdapter();
    await setActiveSlot(adapter, 0);
    await clearActiveSlot(adapter);
    expect(await getActiveSlot(adapter)).toBeNull();
  });

  it('accepts all valid slot IDs (0, 1, 2)', async () => {
    const adapter = makeMemoryAdapter();
    for (const id of [0, 1, 2] as SlotId[]) {
      await setActiveSlot(adapter, id);
      expect(await getActiveSlot(adapter)).toBe(id);
    }
  });

  it('returns null for invalid stored value', async () => {
    const adapter = makeMemoryAdapter();
    await adapter.setItem('game:activeSlot', '99');
    expect(await getActiveSlot(adapter)).toBeNull();
  });
});

describe('slot isolation', () => {
  it('three slots store independent states', async () => {
    const adapter = makeMemoryAdapter();

    let stateA = freshState();
    stateA = gameReducer(stateA, { type: 'ADVANCE_DAY', pace: 'steady' });

    let stateB = freshState();
    stateB = gameReducer(stateB, { type: 'ADVANCE_DAY', pace: 'grueling' });

    let stateC = freshState();

    await saveToSlot(adapter, 0, stateA, 'Fort Kearney');
    await saveToSlot(adapter, 1, stateB, 'Chimney Rock');
    await saveToSlot(adapter, 2, stateC, 'Independence, Missouri');

    const loadedA = await loadSlot(adapter, 0);
    const loadedB = await loadSlot(adapter, 1);
    const loadedC = await loadSlot(adapter, 2);

    expect(loadedA!.day).toBe(1);
    expect(loadedB!.day).toBe(1);
    expect(loadedC!.day).toBe(0);

    // runIds should differ
    expect(loadedA!.runId).not.toBe(loadedB!.runId);
    expect(loadedA!.runId).not.toBe(loadedC!.runId);
  });

  it('overwriting a slot replaces previous data', async () => {
    const adapter = makeMemoryAdapter();
    const state1 = freshState();
    const state2 = freshState();

    await saveToSlot(adapter, 0, state1, 'Fort Kearney');
    await saveToSlot(adapter, 0, state2, 'Oregon City');

    const loaded = await loadSlot(adapter, 0);
    expect(loaded!.runId).toBe(state2.runId);

    const slots = await listSaveSlots(adapter);
    expect(slots[0]!.locationName).toBe('Oregon City');
  });
});
