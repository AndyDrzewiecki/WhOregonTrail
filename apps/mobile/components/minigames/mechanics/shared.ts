/**
 * Shared types for all mechanic components.
 */
import type { MinigameConfig } from '@whoreagon-trail/game-engine';

export interface MechanicProps {
  config: MinigameConfig;
  /** Called with final score 0–100 when mechanic is done */
  onComplete: (score: number) => void;
  /** Called with % progress 0–100 as the player works */
  onProgress: (pct: number) => void;
}
