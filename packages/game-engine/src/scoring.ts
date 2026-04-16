/**
 * Run scoring logic for Whoreagon Trail.
 * Pure functions — no side effects, no React.
 */
import type { GameState } from './state';

export interface RunScore {
  survivors: number;
  totalParty: number;
  survivalRate: number;      // 0–100
  resourceScore: number;     // 0–100
  protectionScore: number;   // 0–100
  resentmentPenalty: number; // 0–100 (lower is better)
  final: number;             // 0–100
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export function computeScore(state: GameState): RunScore {
  const alive = state.party.filter(m => m.isAlive);
  const total = state.party.length;
  const survivors = alive.length;
  const survivalRate = total > 0 ? Math.round((survivors / total) * 100) : 0;

  const { food, water, money, oxenHealth, wagonHealth } = state.resources;
  const resourceScore = Math.round(
    Math.min(100,
      (Math.min(food, 200) / 200) * 25 +
      (Math.min(water, 20) / 20) * 25 +
      (Math.min(money, 200) / 200) * 20 +
      (oxenHealth / 100) * 15 +
      (wagonHealth / 100) * 15,
    )
  );

  const protection = state.hiddenState?.protection ?? 50;
  const resentment = state.hiddenState?.resentment ?? 50;
  const protectionScore = Math.round(Math.min(100, protection));
  const resentmentPenalty = Math.round(Math.min(100, resentment));

  const raw = (
    survivalRate * 0.45 +
    resourceScore * 0.20 +
    protectionScore * 0.20 -
    resentmentPenalty * 0.15
  );

  const final = Math.max(0, Math.min(100, Math.round(raw)));

  // Max achievable raw = 100*0.45 + 100*0.20 + 100*0.20 = 85 (resentment can't go below 0).
  // Grades are set relative to that ceiling.
  const grade: RunScore['grade'] =
    final >= 80 ? 'S' :
    final >= 65 ? 'A' :
    final >= 48 ? 'B' :
    final >= 30 ? 'C' : 'D';

  return { survivors, totalParty: total, survivalRate, resourceScore, protectionScore, resentmentPenalty, final, grade };
}

// ── Epilogue text by route + grade ────────────────────────────────────────────

export function getEpilogue(state: GameState, score: RunScore): string {
  const route = state.route?.type ?? null;
  const { grade, survivors, totalParty } = score;

  const lost = totalParty - survivors;
  const lossLine = lost === 0
    ? 'Everyone made it. That is not nothing.'
    : lost === 1
    ? 'One person did not arrive. You will carry that.'
    : `${lost} people did not arrive. Whether that was inevitable or not is a question you get to live with.`;

  const routeEpilogues: Record<string, Record<string, string>> = {
    fort_route: {
      S: "Oregon City knows your wagon before you arrive. The fort route builds reputation slowly, and you built it right. Delphine's troupe has bookings. The paperwork cleared. You did the hard thing the respectable way.",
      A: "The fort road delivered you in one piece, mostly. The gates were difficult. Some of them remembered you. Oregon City is a fresh ledger.",
      B: "The fort route got you here. Whether it was worth the tolls and the questions and the looks — you are still calculating that. Oregon City doesn't care about your math.",
      C: "You made the fort road work through stubbornness more than skill. Oregon City is a new start. Take it.",
      D: "The fort route nearly had you. Oregon City is the end of that story. Start a different one.",
    },
    wilderness_route: {
      S: "The wilderness road gave you nothing and asked for everything. You came out with people intact and a wagon that still rolls. That is a different kind of respectability — one that doesn't require a gate.",
      A: "The wilderness route stripped everything down to essentials. What survived is real. Oregon City is just a place. The people in the wagon are the destination.",
      B: "The wilderness road was honest about what it cost. You paid most of it. Oregon City will not ask where you've been.",
      C: "Surviving the wilderness route means something, even when the margin was thin. You're here. That's the whole sentence.",
      D: "The wilderness road almost won. The wagon rolled into Oregon City on luck and stubbornness. A new run. A different road.",
    },
    entertainment_circuit: {
      S: "The circuit made you famous before you arrived. Oregon City has heard the name already — Delphine's wagon, the captain who kept the act together through everything. Bookings are waiting. The debt was worth it.",
      A: "The circuit paid off, mostly. Oregon City knows the show. The troupe has a reputation that arrived before the wagon. Use it carefully.",
      B: "The entertainment circuit is a machine that eats captains. You came out recognizable. Oregon City has venues. The work continues.",
      C: "The circuit was a gamble that broke even. Oregon City is a fresh audience. Start over with a different act.",
      D: "The circuit cost more than it returned. Oregon City is a reset. What you do next is not defined by what the circuit made you do.",
    },
  };

  const defaultEpilogues: Record<string, string> = {
    S: "Two thousand miles. The wagon rolls into Oregon City with people who chose to make it. You kept them. That is the whole story.",
    A: "Oregon City. The trail is behind you. The hard decisions were yours and most of them held. A good run.",
    B: "You made it. Not clean, not without cost, but here. Oregon City doesn't ask how you got there.",
    C: "The wagon made Oregon City. So did you, and so did some of your party. That counts.",
    D: "Oregon City. The end of the trail. You are alive. Start from there.",
  };

  const gradeLines = route ? (routeEpilogues[route] ?? defaultEpilogues) : defaultEpilogues;
  const epilogueLine = gradeLines[grade] ?? gradeLines['B'] ?? '';

  return [epilogueLine, lossLine].filter(Boolean).join('\n\n');
}
