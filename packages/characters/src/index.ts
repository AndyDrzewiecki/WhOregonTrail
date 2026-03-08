/**
 * @whoreagon-trail/characters
 *
 * Character schema, 20-character stable, and relationship utilities.
 */

// ── Schema types + utilities ────────────────────────────────────────────────
export type { Character, CharacterId, RelationshipMatrix } from './schema';
export { createRelationshipMatrix, getRelationshipLabel } from './schema';

// ── Full character stable ───────────────────────────────────────────────────
export { characterStable } from './stable';
