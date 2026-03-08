import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { Character } from '@whoreagon-trail/characters';
import { COLORS } from '@/src/constants/colors';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  isRevealed: boolean;
  onPress: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected,
  isRevealed,
  onPress,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - 48) / 2;

  // Determine top 3 personality descriptors
  const descriptors = useMemo(() => {
    const ocean = character.ocean || { o: 0, c: 0, e: 0, a: 0, n: 0 };
    const dimensions = [
      { label: 'Curious mind', key: 'o', score: ocean.o },
      { label: 'Keeps the accounts', key: 'c', score: ocean.c },
      { label: 'Fills the room', key: 'e', score: ocean.e },
      { label: 'Keeps the peace', key: 'a', score: ocean.a },
      { label: 'Carries the weight', key: 'n', score: ocean.n },
    ];

    const sorted = dimensions.sort((a, b) => b.score - a.score);
    const top3 = sorted.slice(0, 3);

    return top3.map((dim) => {
      if (dim.score > 7) {
        return dim.label;
      } else {
        const nameMap: Record<string, string> = {
          o: 'Openness',
          c: 'Conscientiousness',
          e: 'Extraversion',
          a: 'Agreeableness',
          n: 'Neuroticism',
        };
        return `${nameMap[dim.key]}: ${dim.score}`;
      }
    });
  }, [character.ocean]);

  const borderColor = isRevealed ? COLORS.gold : COLORS.goldDim;
  const transform = isSelected ? [{ scale: 1.03 }] : [];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          width: cardWidth,
          borderColor,
          transform,
        },
      ]}
    >
      {/* Main card content */}
      <View style={styles.content}>
        <Text style={styles.characterName}>{character.name}</Text>
        <Text style={styles.ageRaceReligion}>
          {character.age} · {character.race} · {character.religion}
        </Text>

        {/* Personality descriptors */}
        <View style={styles.descriptorContainer}>
          {descriptors.map((desc, idx) => (
            <Text key={idx} style={styles.descriptor}>
              {desc}
            </Text>
          ))}
        </View>

        {/* Performance trait */}
        <Text style={styles.performanceTrait}>{character.performanceTrait}</Text>
      </View>

      {/* Bottom strip */}
      <View style={styles.bottomStrip}>
        <Text style={styles.stripText}>
          {isRevealed ? character.hiddenTrait : 'TAP TO REVEAL'}
        </Text>
      </View>

      {/* TAP TO SELECT text (only when revealed, not selected) */}
      {isRevealed && !isSelected && (
        <Text style={styles.tapToSelect}>TAP TO SELECT</Text>
      )}

      {/* Selected overlay and checkmark */}
      {isSelected && (
        <>
          <View style={styles.selectedOverlay} />
          <Text style={styles.checkmark}>✓</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderRadius: 2,
    borderColor: COLORS.goldDim,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'flex-start',
  },
  characterName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.bg,
    letterSpacing: 1,
  },
  ageRaceReligion: {
    fontSize: 12,
    color: '#5a3a1a',
    marginTop: 4,
  },
  descriptorContainer: {
    marginTop: 8,
  },
  descriptor: {
    fontSize: 13,
    color: '#3a2010',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  performanceTrait: {
    fontSize: 12,
    color: '#5a3a1a',
    fontStyle: 'italic',
    marginTop: 8,
  },
  bottomStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripText: {
    fontSize: 10,
    color: COLORS.paper,
    letterSpacing: 3,
    fontStyle: 'italic',
  },
  tapToSelect: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    fontSize: 9,
    color: COLORS.goldDim,
    letterSpacing: 2,
    textAlign: 'center',
    paddingBottom: 4,
    marginTop: 32,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(201,168,76,0.12)',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 20,
    color: COLORS.gold,
    fontWeight: 'bold',
  },
});

export default CharacterCard;
