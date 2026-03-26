/**
 * @whoreagon-trail/characters
 *
 * Character schema, 20-character stable, and relationship utilities.
 */

// ── Schema types + utilities ────────────────────────────────────────────────
export type { Character, CharacterId, RelationshipMatrix, RelationshipSeed } from './schema';
export { createRelationshipMatrix, getRelationshipLabel } from './schema';

// ── Relationship seeds ──────────────────────────────────────────────────────
export { RELATIONSHIP_SEEDS } from './seeds';

// ── Full character stable ───────────────────────────────────────────────────
export { characterStable } from './stable';
