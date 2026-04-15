/**
 * Save slot management for Whoreagon Trail.
 *
 * Supports up to SLOT_COUNT independent named save slots.
 * Each slot stores the full GameState and a lightweight metadata
 * summary for quick display on the landing page.
 *
 * Slot data keys:   game:slot:0 / game:slot:1 / game:slot:2
 * Slot meta keys:   game:slot:0:meta / game:slot:1:meta / game:slot:2:meta
 * Active slot key:  game:activeSlot
 */

import type { StorageAdapter } from './storage';
import type { GameState, TrailLocation } from './state';

// ── Constants ────────────────────────────────────────────────────────────────

export const SLOT_COUNT = 3;
export const ACTIVE_SLOT_KEY = 'game:activeSlot';

export type SlotId = 0 | 1 | 2;

// ── SaveSlotMeta ─────────────────────────────────────────────────────────────

export type SaveSlotMeta = {
  slotId: SlotId;
  runId: string;
  day: number;
  location: TrailLocation;
  locationName: string;
  partyNames: string[];    // alive party members (up to 4)
  savedAt: number;         // Unix timestamp ms
  routeType: string | null;
  totalMilesTraveled: number;
};

// ── Storage key helpers ──────────────────────────────────────────────────────

function slotDataKey(id: SlotId): string {
  return `game:slot:${id}`;
}

function slotMetaKey(id: SlotId): string {
  return `game:slot:${id}:meta`;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Read metadata for all save slots. Returns null for empty slots.
 */
export async function listSaveSlots(
  adapter: StorageAdapter
): Promise<(SaveSlotMeta | null)[]> {
  return Promise.all(
    ([0, 1, 2] as SlotId[]).map(async (id) => {
      try {
        const raw = await adapter.getItem(slotMetaKey(id));
        if (!raw) return null;
        return JSON.parse(raw) as SaveSlotMeta;
      } catch {
        return null;
      }
    })
  );
}

/**
 * Persist a game state to a named slot, with metadata summary.
 */
export async function saveToSlot(
  adapter: StorageAdapter,
  slotId: SlotId,
  state: GameState,
  locationDisplayName: string
): Promise<void> {
  const meta: SaveSlotMeta = {
    slotId,
    runId: state.runId,
    day: state.day,
    location: state.location,
    locationName: locationDisplayName,
    partyNames: state.party
      .filter((m) => m.isAlive)
      .map((m) => m.name)
      .slice(0, 4),
    savedAt: Date.now(),
    routeType: state.route?.type ?? null,
    totalMilesTraveled: state.totalMilesTraveled,
  };

  await Promise.all([
    adapter.setItem(slotDataKey(slotId), JSON.stringify(state)),
    adapter.setItem(slotMetaKey(slotId), JSON.stringify(meta)),
  ]);
}

/**
 * Load the full GameState from a named slot. Returns null if empty/corrupt.
 */
export async function loadSlot(
  adapter: StorageAdapter,
  slotId: SlotId
): Promise<GameState | null> {
  try {
    const raw = await adapter.getItem(slotDataKey(slotId));
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

/**
 * Delete a save slot (both data and metadata).
 */
export async function deleteSlot(
  adapter: StorageAdapter,
  slotId: SlotId
): Promise<void> {
  await Promise.all([
    adapter.removeItem(slotDataKey(slotId)),
    adapter.removeItem(slotMetaKey(slotId)),
  ]);
}

/**
 * Get the active slot ID from storage. Returns null if none selected.
 */
export async function getActiveSlot(
  adapter: StorageAdapter
): Promise<SlotId | null> {
  try {
    const raw = await adapter.getItem(ACTIVE_SLOT_KEY);
    if (raw === null) return null;
    const id = parseInt(raw, 10);
    if (id === 0 || id === 1 || id === 2) return id as SlotId;
    return null;
  } catch {
    return null;
  }
}

/**
 * Set the active slot in storage.
 */
export async function setActiveSlot(
  adapter: StorageAdapter,
  slotId: SlotId
): Promise<void> {
  await adapter.setItem(ACTIVE_SLOT_KEY, String(slotId));
}

/**
 * Clear the active slot pointer (used when run ends).
 */
export async function clearActiveSlot(adapter: StorageAdapter): Promise<void> {
  await adapter.removeItem(ACTIVE_SLOT_KEY);
}
