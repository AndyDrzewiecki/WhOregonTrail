/**
 * Shared props interface for all mechanic components.
 */
import type { MinigameConfig } from '@whoreagon-trail/game-engine';
import type { MinigameResult } from '../MinigameEngine';

export interface MechanicProps {
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
  onProgress?: (score: number) => void;
}
