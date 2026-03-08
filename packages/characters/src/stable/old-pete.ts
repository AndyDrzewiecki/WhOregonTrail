import type { Character } from '../schema';

export const character: Character = {
  id: 'old-pete',
  name: 'Peter Dunmore',
  age: 63,
  religion: 'Congregationalist',
  race: 'White',
  sex: 'Male',
  orientation: 'Heterosexual',
  skinTone: 'Weathered tan, deeply lined',
  voice: 'Rasps like a mule skinner who learned poetry from whiskey-each word deliberate, laced with irony.',
  moralCode: `Survival and silence. What you've seen stays buried with the bodies; what keeps the wagon moving is all that matters.`,
  personality: { O: 7, C: 8, E: 6, A: 4, N: 3 },
  conflictResolutionType: 'Deflector',
  performanceTrait: 'Fiddler who plays jigs and funeral marches with equal precision',
  hiddenTrait: `He knows where three different people's bodies are buried along this trail and was present at each occasion.`,
  background: `Peter drove freight wagons and scout parties from 1820 onward, witnessing stampedes, treachery, and frontier justice he never reported. In 1835 he held a dying man's hand near Chimney Rock-a man who owed money to someone in the party. In 1839 a Chinese laborer fell from Pete's wagon outside Fort Laramie under circumstances Pete alone saw. By 1848, he's driving a traveling troupe because the frontier he knows is closing, and ghosts don't haunt someone who accepts they're always there.`,
};
