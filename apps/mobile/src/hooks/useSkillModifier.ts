/**
 * useSkillModifier
 *
 * Returns a score floor and time bonus for minigames based on the best
 * relevant skill in the alive party, scaled by the current difficulty setting.
 *
 * - TAP (hunting): uses survival.hunting
 * - All other mechanics: uses max(performance.dance, .singing, .acting)
 */
import { useGameState } from '@whoreagon-trail/game-engine';

export type SkillModifier = {
  /** Extra milliseconds added to the minigame duration (0–3000) */
  timeBonus: number;
  /** Starting score offset for the minigame (0–20) */
  scoreFloor: number;
};

const DIFFICULTY_MULT: Record<string, number> = {
  easy:   1.3,
  normal: 1.0,
  hard:   0.7,
};

export function useSkillModifier(mechanic: string | undefined): SkillModifier {
  const { state } = useGameState();

  if (!state || !mechanic) return { timeBonus: 0, scoreFloor: 0 };

  const diffMult = DIFFICULTY_MULT[state.difficulty ?? 'normal'] ?? 1.0;
  const alive = state.party.filter((m) => m.isAlive);

  let bestScore = 5; // default mid-tier (1-10 scale)

  if (mechanic === 'TAP') {
    // Hunting uses survival skill
    const scores = alive.map((m) => {
      const skills = (m as Record<string, unknown>).skills as Record<string, unknown> | undefined;
      const survival = skills?.survival as Record<string, unknown> | undefined;
      return (survival?.hunting as number) ?? 5;
    });
    if (scores.length > 0) bestScore = Math.max(...scores);
  } else {
    // Performance mechanics use best of dance/singing/acting
    const scores = alive.map((m) => {
      const skills = (m as Record<string, unknown>).skills as Record<string, unknown> | undefined;
      const perf = skills?.performance as Record<string, unknown> | undefined;
      if (!perf) return 5;
      return Math.max(
        (perf.dance as number) ?? 5,
        (perf.singing as number) ?? 5,
        (perf.acting as number) ?? 5,
      );
    });
    if (scores.length > 0) bestScore = Math.max(...scores);
  }

  // bestScore 1–10 → scoreFloor 0–20, timeBonus 0–3000ms
  const scoreFloor = Math.round((bestScore / 10) * 20 * diffMult);
  const timeBonus  = Math.round((bestScore / 10) * 3000 * diffMult);

  return { scoreFloor, timeBonus };
}
