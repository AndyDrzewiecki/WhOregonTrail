import type { GameState } from '@whoreagon-trail/game-engine';

/**
 * Builds a per-character callback signal string based on how the player has
 * treated a specific party member over the course of the run. These signals
 * are injected into AI prompts to drive specific, authored reactions — not
 * generic ones. Returns an empty string if no specific callback applies.
 *
 * @param state            Current game state
 * @param targetCharacterId  The party member whose history we're surfacing
 * @param context          Scene context that shapes which signals are relevant
 */
export function buildCharacterCallbackSignal(
  state: GameState,
  targetCharacterId: string,
  context: 'conflict' | 'coaching' | 'campfire' | 'gatekeeper'
): string {
  // Guard: character must be in the party
  const targetChar = state.party.find(m => m.id === targetCharacterId);
  if (!targetChar) return '';

  const memory = state.runMemory;

  // ── Step 1: Gather what happened to this character ──────────────────────────

  const wasProtected = memory.protectedCharacterIds.includes(targetCharacterId);
  const wasUsed = memory.usedCharacterIds.includes(targetCharacterId);

  const wasCoached = memory.events.some(
    e => e.type === 'coaching_moment' && e.characterId === targetCharacterId
  );
  const coachingPositive = memory.events.some(
    e => e.type === 'coaching_moment' && e.characterId === targetCharacterId && e.sentiment === 'positive'
  );
  const coachingNegative = memory.events.some(
    e => e.type === 'coaching_moment' && e.characterId === targetCharacterId && e.sentiment === 'negative'
  );

  const boundaryDefendedForThem = memory.events.some(
    e => e.type === 'boundary_defended' && e.characterId === targetCharacterId
  );
  const boundaryCrossedForThem = memory.events.some(
    e => e.type === 'boundary_crossed' && e.characterId === targetCharacterId
  );
  const sacrificed = memory.events.some(
    e => e.type === 'sacrifice_made' && e.characterId === targetCharacterId
  );

  // Suppress TS unused-variable warning for wasCoached — it gates the coaching
  // check block only indirectly; kept for future context expansion.
  void wasCoached;

  // ── Step 2: Get relationship score (player → target) ────────────────────────

  const playerId = state.party[0]?.id;
  const rel = playerId ? (state.relationshipMatrix[playerId]?.[targetCharacterId] ?? 0) : 0;

  // ── Step 3: Build behavior string per context ────────────────────────────────

  if (context === 'conflict') {
    if (wasProtected && !wasUsed) {
      return `CHARACTER CALLBACK (${targetChar.name}): This person has been protected. In conflict, they volunteer first, speak warmly, back the captain publicly. Their investment is real.`;
    }
    if (wasUsed && !wasProtected) {
      return `CHARACTER CALLBACK (${targetChar.name}): This person has been used. In conflict, they comply coldly, do the minimum required, avoid eye contact with the captain. Their investment has limits.`;
    }
    if (wasProtected && wasUsed) {
      return `CHARACTER CALLBACK (${targetChar.name}): Protected once, used once. They're watching the pattern. In conflict, they help but hesitate — waiting to see which version of the captain shows up.`;
    }
    if (boundaryCrossedForThem) {
      return `CHARACTER CALLBACK (${targetChar.name}): Their boundary was crossed. They're still here but carrying it. In conflict, expect sarcasm, distance, or deliberate slowness.`;
    }
    if (boundaryDefendedForThem) {
      return `CHARACTER CALLBACK (${targetChar.name}): Their boundary was defended. They remember. In conflict, they show up fully — no hesitation.`;
    }
    if (rel < -30) {
      return `CHARACTER CALLBACK (${targetChar.name}): Relationship has broken down (rel: ${rel}). They might not cooperate willingly. Expect pushback.`;
    }
    if (rel > 50) {
      return `CHARACTER CALLBACK (${targetChar.name}): Strong trust built (rel: ${rel}). They follow the captain's lead without being asked.`;
    }
    return '';
  }

  if (context === 'coaching') {
    if (wasUsed && !wasProtected) {
      return `CHARACTER CALLBACK (${targetChar.name}): They've been used before. Approach this coaching with care — they'll be skeptical of being asked for anything.`;
    }
    if (coachingNegative) {
      return `CHARACTER CALLBACK (${targetChar.name}): Prior coaching went badly. They remember the last conversation. Don't expect goodwill as a starting point.`;
    }
    if (coachingPositive) {
      return `CHARACTER CALLBACK (${targetChar.name}): Prior coaching went well. There's an established channel here. They're more open than a stranger would be.`;
    }
    if (boundaryDefendedForThem) {
      return `CHARACTER CALLBACK (${targetChar.name}): Their boundary was defended by the captain. They're more willing to be vulnerable in private.`;
    }
    return '';
  }

  if (context === 'campfire') {
    if (sacrificed) {
      return `CHARACTER CALLBACK (${targetChar.name}): Was asked to sacrifice. Tonight at campfire, they're quieter than usual. Their presence feels like a question that hasn't been answered.`;
    }
    if (wasUsed && !wasProtected) {
      return `CHARACTER CALLBACK (${targetChar.name}): Has been used. Tonight they're not participating in the warmth. They're present but separate.`;
    }
    if (wasProtected) {
      return `CHARACTER CALLBACK (${targetChar.name}): Has been protected. Tonight they're the one keeping spirits up — unconsciously returning what was given.`;
    }
    if (boundaryCrossedForThem) {
      return `CHARACTER CALLBACK (${targetChar.name}): Boundary was crossed. They're at the campfire but facing away from the group slightly. The body language says what they won't.`;
    }
    return '';
  }

  if (context === 'gatekeeper') {
    if (wasProtected) {
      return `CHARACTER CALLBACK (${targetChar.name}): Was protected. At the gate, they stand close, present a unified front without being asked.`;
    }
    if (wasUsed) {
      return `CHARACTER CALLBACK (${targetChar.name}): Was used. At the gate, they play their role but the captain should notice the minimal effort. They're not invested in this outcome.`;
    }
    return '';
  }

  return '';
}
