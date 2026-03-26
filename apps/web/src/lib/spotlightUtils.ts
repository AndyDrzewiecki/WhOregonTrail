import type { GameState } from '@whoreagon-trail/game-engine';

/**
 * Select the party member who should be the emotional focal point of the current scene.
 * Varies based on hiddenState, runMemory, and relationship scores.
 */
export function selectSpotlightCharacter(state: GameState): string | null {
  const aliveMembers = state.party.filter(m => m.isAlive && m.id !== state.party[0]?.id);
  if (aliveMembers.length === 0) return null;

  const hidden = state.hiddenState;
  const memory = state.runMemory;
  const playerId = state.party[0]?.id;
  const relationships = playerId ? (state.relationshipMatrix[playerId] ?? {}) : {};

  // Priority 1: someone who was "used" recently and has low relationship
  const usedAndLow = aliveMembers.find(m =>
    memory?.usedCharacterIds.includes(m.id) &&
    (relationships[m.id] ?? 0) < 20
  );
  if (usedAndLow) return usedAndLow.id;

  // Priority 2: high resentment + someone with a specific role assignment
  if ((hidden?.resentment ?? 0) > 45) {
    const roleFlag = state.flags.find(f => f.startsWith('ROLE_ASSIGNMENT:'));
    if (roleFlag) {
      // Find the member most likely to be the role assignee by checking recent coaching memory
      const coachingEvent = [...(memory?.events ?? [])].reverse().find(e => e.type === 'coaching_moment' && e.characterId);
      if (coachingEvent?.characterId) {
        const coached = aliveMembers.find(m => m.id === coachingEvent.characterId);
        if (coached) return coached.id;
      }
    }
  }

  // Priority 3: low obedience → spotlight the most resistant member (lowest relationship)
  if ((hidden?.obedience ?? 60) < 35) {
    const mostResistant = [...aliveMembers]
      .sort((a, b) => (relationships[a.id] ?? 0) - (relationships[b.id] ?? 0))[0];
    return mostResistant?.id ?? null;
  }

  // Priority 4: high protection → spotlight who was protected
  if ((hidden?.protection ?? 50) > 65 && memory?.protectedCharacterIds.length) {
    const protected_ = aliveMembers.find(m => memory.protectedCharacterIds.includes(m.id));
    if (protected_) return protected_.id;
  }

  // Default: the member with the most volatile relationship score (furthest from 0)
  const mostVolatile = [...aliveMembers]
    .sort((a, b) => Math.abs(relationships[b.id] ?? 0) - Math.abs(relationships[a.id] ?? 0))[0];
  return mostVolatile?.id ?? null;
}

/**
 * Build a spotlight signal string to inject into scene prompts.
 */
export function buildSpotlightSignal(state: GameState): string {
  const spotlightId = selectSpotlightCharacter(state);
  if (!spotlightId) return '';

  const member = state.party.find(m => m.id === spotlightId);
  if (!member) return '';

  const memory = state.runMemory;
  const wasUsed = memory?.usedCharacterIds.includes(spotlightId);
  const wasProtected = memory?.protectedCharacterIds.includes(spotlightId);
  const relationships = state.party[0] ? (state.relationshipMatrix[state.party[0].id] ?? {}) : {};
  const score = relationships[spotlightId] ?? 0;

  const context = wasUsed
    ? `has been asked to sacrifice before and is still carrying it`
    : wasProtected
      ? `was looked out for — they notice who protects them`
      : score < -20
        ? `has real grievances with the captain's decisions`
        : score > 40
          ? `trusts the captain enough to volunteer something`
          : `is watching the captain carefully, deciding`;

  return `SPOTLIGHT: ${member.name} ${context}. Make them the emotional center of at least one exchange in this scene. Their reaction to the player's choice should be specific to their history with the captain, not generic.`;
}
