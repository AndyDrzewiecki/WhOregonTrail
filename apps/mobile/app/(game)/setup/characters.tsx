import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { characterStable, Character } from '@whoreagon-trail/characters';
import { useGameState } from '@whoreagon-trail/game-engine';
import { router } from 'expo-router';
import CharacterCard from '@/src/components/CharacterCard';
import { COLORS } from '@/src/constants/colors';

const FOUNDING_FOUR = [
  'delphine-marchais',
  'mama-szabo',
  'sister-agnes',
  'old-pete',
];

export default function CharactersScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { dispatch, state } = useGameState();

  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shakeCount, setShakeCount] = useState(0);

  // Get available characters (exclude founding four)
  const availableCharacters = useMemo(() => {
    return characterStable.filter((char) => !FOUNDING_FOUR.includes(char.id));
  }, []);

  // Handle card press
  const handleCardPress = (characterId: string) => {
    const isRevealed = revealedIds.has(characterId);
    const isSelected = selectedIds.includes(characterId);

    if (!isRevealed) {
      // First press: reveal
      setRevealedIds((prev) => new Set([...prev, characterId]));
    } else if (!isSelected) {
      // Second press: select (if not at limit)
      if (selectedIds.length < 4) {
        setSelectedIds((prev) => [...prev, characterId]);
      } else {
        // Flash shake count (attempt to select when full)
        setShakeCount((prev) => prev + 1);
        setTimeout(() => setShakeCount(0), 300);
      }
    } else {
      // Third press: deselect
      setSelectedIds((prev) => prev.filter((id) => id !== characterId));
    }
  };

  // Handle continue
  const handleContinue = async () => {
    if (selectedIds.length !== 4) return;

    // Get selected Character objects
    const selectedCharacters = selectedIds
      .map((id) => characterStable.find((char) => char.id === id))
      .filter((char): char is Character => !!char);

    // Get remaining pool (all 16 - selected 4 = 12)
    const remainingPool = characterStable.filter(
      (char) => !FOUNDING_FOUR.includes(char.id) && !selectedIds.includes(char.id)
    );

    // Pick 4 random from remaining pool
    const randomCharacters: Character[] = [];
    const poolCopy = [...remainingPool];
    for (let i = 0; i < 4 && poolCopy.length > 0; i++) {
      const randomIdx = Math.floor(Math.random() * poolCopy.length);
      randomCharacters.push(poolCopy[randomIdx]);
      poolCopy.splice(randomIdx, 1);
    }

    // Dispatch add party members
    dispatch({
      type: 'ADD_PARTY_MEMBERS',
      payload: [...selectedCharacters, ...randomCharacters],
    });

    // Navigate to supplies
    router.push('/(game)/setup/supplies');
  };

  const renderCharacterCard = ({ item }: { item: Character }) => (
    <CharacterCard
      character={item}
      isSelected={selectedIds.includes(item.id)}
      isRevealed={revealedIds.has(item.id)}
      onPress={() => handleCardPress(item.id)}
    />
  );

  const countColor = selectedIds.length === 4 ? COLORS.gold : COLORS.cream;
  const shakeCountColor = shakeCount > 0 ? COLORS.error : countColor;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Company</Text>
        <Text style={styles.headerSubtitle}>
          Select 4. The road chooses the rest.
        </Text>
      </View>

      {/* Character grid */}
      <FlatList
        data={availableCharacters}
        renderItem={renderCharacterCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.contentContainer}
        scrollEnabled={true}
      />

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={[styles.countText, { color: shakeCountColor }]}>
          {selectedIds.length}/4 chosen
        </Text>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={selectedIds.length !== 4}
          style={[
            styles.continueButton,
            selectedIds.length === 4
              ? styles.continueButtonActive
              : styles.continueButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.continueButtonText,
              {
                color:
                  selectedIds.length === 4 ? COLORS.cream : COLORS.goldDim,
              },
            ]}
          >
            Continue →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.cream,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.goldDim,
    marginTop: 4,
  },
  columnWrapper: {
    gap: 16,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.darkCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.goldDim,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 2,
  },
  continueButtonActive: {
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  continueButtonDisabled: {
    borderWidth: 0,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
