/**
 * Character schema for Whoreagon Trail.
 * Every character in the stable conforms to this shape.
 */

export type CharacterId = string;

export type Character = {
  id: CharacterId;
  name: string;
  age: number;
  religion: string;
  race: string;
  sex: string;
  orientation: string;
  skinTone: string;
  voice: string; // how they sound and speak — one evocative sentence
  moralCode: string; // what they actually believe, not what they say they believe
  personality: {
    O: number; // Openness 1-10
    C: number; // Conscientiousness 1-10
    E: number; // Extraversion 1-10
    A: number; // Agreeableness 1-10
    N: number; // Neuroticism 1-10
  };
  conflictResolutionType: 'Mediator' | 'Avoider' | 'Confronter' | 'Deflector' | 'Martyr';
  performanceTrait: string; // what they do on stage — one specific skill
  hiddenTrait: string; // the secret revealed when the player selects them — one sentence, creates dramatic tension
  background?: string; // 2-3 sentences for AI prompt context — not shown to player
};

export type RelationshipMatrix = Record<CharacterId, Record<CharacterId, number>>;

export function createRelationshipMatrix(characters: Character[]): RelationshipMatrix {
  // Initialize all pairs to 0
  const matrix: RelationshipMatrix = {};
  for (const a of characters) {
    matrix[a.id] = {};
    for (const b of characters) {
      if (a.id !== b.id) {
        matrix[a.id][b.id] = 0;
      }
    }
  }
  return matrix;
}

export function getRelationshipLabel(score: number): string {
  if (score <= -60) return 'Mortal Enemy';
  if (score <= -40) return 'Enemy';
  if (score <= -20) return 'Rival';
  if (score < 0) return 'Unfriendly';
  if (score < 20) return 'Stranger';
  if (score < 40) return 'Distant';
  if (score < 60) return 'Acquaintance';
  if (score < 80) return 'Friend';
  return 'Close Friend';
}
