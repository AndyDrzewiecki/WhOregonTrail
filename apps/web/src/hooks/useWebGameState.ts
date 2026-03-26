'use client';
import { useGameState, localStorageAdapter } from '@whoreagon-trail/game-engine';

export function useWebGameState() {
  return useGameState(localStorageAdapter);
}
