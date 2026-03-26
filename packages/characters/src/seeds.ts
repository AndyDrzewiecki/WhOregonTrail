/**
 * Relationship seeds — initial non-zero relationship scores
 * based on character backstories and pre-existing connections.
 */

import type { RelationshipSeed } from './schema';

export const RELATIONSHIP_SEEDS: RelationshipSeed[] = [
  // Sun Li is devoted to her brother Jin Wei
  { a: 'sun-li', b: 'jin-wei', scoreAtoB: 40, scoreBtoA: 25 },

  // Delphine is employer/troupe leader — bidirectional warmth with performers
  { a: 'delphine-marchais', b: 'beau-fontaine', scoreAtoB: 15, scoreBtoA: 15 },
  { a: 'delphine-marchais', b: 'two-rivers', scoreAtoB: 15, scoreBtoA: 15 },
  { a: 'delphine-marchais', b: 'doc-price', scoreAtoB: 15, scoreBtoA: 15 },
  { a: 'delphine-marchais', b: 'charlie-bloom', scoreAtoB: 10, scoreBtoA: 20 },

  // Wolf Shirt and Crow Feather — Indigenous shared awareness
  { a: 'wolf-shirt', b: 'crow-feather', scoreAtoB: 20, scoreBtoA: 20 },

  // Mama Szabo and Sister Agnes — tension between poison-wielder and nun
  { a: 'mama-szabo', b: 'sister-agnes', scoreAtoB: -10, scoreBtoA: -10 },

  // Reverend Cain disapproves of Delphine's identity
  { a: 'reverend-cain', b: 'delphine-marchais', scoreAtoB: -15, scoreBtoA: -15 },

  // Old Pete and Tommy Two-Toes — old road companions
  { a: 'old-pete', b: 'tommy-two-toes', scoreAtoB: 25, scoreBtoA: 20 },

  // Esperanza and Lena — shared Latin American heritage, mutual respect
  { a: 'esperanza-vega', b: 'lena-vasquez', scoreAtoB: 15, scoreBtoA: 15 },

  // Grace Chen and Doc Price — both educated, intellectual bond
  { a: 'grace-chen', b: 'doc-price', scoreAtoB: 10, scoreBtoA: 10 },

  // Colm O'Brien and Private Walker — military friction
  { a: 'colm-o-brien', b: 'private-walker', scoreAtoB: -10, scoreBtoA: -5 },
];
