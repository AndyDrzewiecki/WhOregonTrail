/**
 * Pre-authored character framing for the browser vertical slice.
 * Shown as character cards before AI dialogue runs — ensures the player
 * understands the wagon's social structure without depending on AI improvisation.
 *
 * These are NOT relationship bars. They are role descriptions.
 * Update as characters are developed.
 */

export interface CharacterFrame {
  id: string;
  name: string;
  role: string;
  strength: string;
  liability: string;
  economyNote: string; // how they relate to the wagon's survival economy
  firstImpression: string; // what you see when you walk in
}

export const CHARACTER_FRAMES: CharacterFrame[] = [
  {
    id: 'delphine-marchais',
    name: 'Delphine Marchais',
    role: 'Troupe Leader',
    strength: 'Authority, negotiation, reading a room before it reads her',
    liability: 'Makes promises she cannot always keep. People remember.',
    economyNote: 'Organizes performances. Decides who works, at what, with whom. Her word is contract.',
    firstImpression: 'Sitting at the head of the table like she built the table herself.',
  },
  {
    id: 'mama-szabo',
    name: 'Mama Szabo',
    role: 'Medicine & Protection',
    strength: 'Keeps people alive. Also keeps people scared. Both are services.',
    liability: 'Does not forgive. Does not forget. Not a single time.',
    economyNote: 'Medical care, threat deterrence, and the kind of reputation that stops trouble before it starts.',
    firstImpression: 'Watching the door. Has been watching it since before you arrived.',
  },
  {
    id: 'sister-agnes',
    name: 'Sister Agnes',
    role: 'Front-of-House / Moral Credibility',
    strength: 'Makes forts trust you. Her presence alone lowers suspicion.',
    liability: 'Her guilt about this life will surface at the worst moment.',
    economyNote: 'The respectable face. Essential at forts. Increasingly conflicted about being useful this way.',
    firstImpression: 'Reading a bible with the practiced stillness of someone who knows people are watching.',
  },
  {
    id: 'old-pete',
    name: 'Old Pete',
    role: 'Trail Scout & Guide',
    strength: 'Knows every river crossing, every hostile approach, every shortcut.',
    liability: 'Treats the troupe as cargo. Has not decided whether that is their problem or his.',
    economyNote: 'Gets you there alive. What you do when you arrive is not his concern. He has made this clear.',
    firstImpression: 'Looking at a map. Not the one on the wall. A better one, in his head.',
  },
  {
    id: 'reverend-cain',
    name: 'Reverend Cain',
    role: 'Wild Card / Theological Pressure',
    strength: 'Intimidates gatekeepers. Commands rooms. Useful at forts where faith is currency.',
    liability: 'Will turn on Delphine. Not if. When. The only question is what costs least when he does.',
    economyNote: 'His presence is both protection and a lit match. You need him and cannot fully trust him.',
    firstImpression: 'Standing apart from everyone else. Not hostile. Just separate. Watching you specifically.',
  },
];

export function getFrameById(id: string): CharacterFrame | undefined {
  return CHARACTER_FRAMES.find(f => f.id === id);
}
