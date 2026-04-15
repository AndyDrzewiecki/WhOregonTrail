'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  listSaveSlots,
  loadSlot,
  saveToSlot,
  deleteSlot,
  setActiveSlot,
  getActiveSlot,
  clearActiveSlot,
  type SaveSlotMeta,
  type SlotId,
} from '@whoreagon-trail/game-engine';
import { localStorageAdapter } from '@whoreagon-trail/game-engine';
import { getLocationDisplayName } from '@whoreagon-trail/game-engine';
import type { GameState } from '@whoreagon-trail/game-engine';

const adapter = localStorageAdapter;

export type SlotInfo = SaveSlotMeta | null;

export function useSaveSlots() {
  const [slots, setSlots] = useState<SlotInfo[]>([null, null, null]);
  const [activeSlot, setActiveSlotState] = useState<SlotId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [slotList, active] = await Promise.all([
      listSaveSlots(adapter),
      getActiveSlot(adapter),
    ]);
    setSlots(slotList);
    setActiveSlotState(active);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Load a slot: copies slot data to currentRun, sets activeSlot, returns the state.
   */
  const load = useCallback(async (slotId: SlotId): Promise<GameState | null> => {
    const state = await loadSlot(adapter, slotId);
    if (!state) return null;
    // Write to currentRun so useGameState picks it up
    await adapter.setItem('game:currentRun', JSON.stringify(state));
    await setActiveSlot(adapter, slotId);
    setActiveSlotState(slotId);
    return state;
  }, []);

  /**
   * Save current game state to a slot.
   */
  const save = useCallback(async (slotId: SlotId, state: GameState): Promise<void> => {
    const locationName = getLocationDisplayName(state.location);
    await saveToSlot(adapter, slotId, state, locationName);
    await setActiveSlot(adapter, slotId);
    setActiveSlotState(slotId);
    await refresh();
  }, [refresh]);

  /**
   * Delete a save slot.
   */
  const remove = useCallback(async (slotId: SlotId): Promise<void> => {
    await deleteSlot(adapter, slotId);
    if (activeSlot === slotId) {
      await clearActiveSlot(adapter);
      setActiveSlotState(null);
    }
    await refresh();
  }, [activeSlot, refresh]);

  /**
   * Start a new game in a specific slot (clears currentRun, sets active slot).
   */
  const startNew = useCallback(async (slotId: SlotId): Promise<void> => {
    await adapter.removeItem('game:currentRun');
    await setActiveSlot(adapter, slotId);
    setActiveSlotState(slotId);
  }, []);

  return { slots, activeSlot, isLoading, load, save, remove, startNew, refresh };
}

/**
 * Minimal hook used inside the game to auto-save to the active slot.
 * Call this from game/page.tsx after each meaningful state change.
 */
export function useAutoSaveToSlot(state: GameState | null) {
  const save = useCallback(async () => {
    if (!state || !state.runId || state.phase === 'END') return;
    const slotId = await getActiveSlot(adapter);
    if (slotId === null) return;
    const locationName = getLocationDisplayName(state.location);
    await saveToSlot(adapter, slotId, state, locationName);
  }, [state]);

  return { saveNow: save };
}
