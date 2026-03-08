/**
 * FORT SCREEN
 *
 * The troupe has reached a fort. Activities:
 * - Book a performance (earns money, affects reputation)
 * - Trade supplies
 * - Rest (recovers morale/health)
 * - Character interactions trigger here
 *
 * fortId: one of the named forts along the trail
 * (Fort Kearny, Fort Laramie, Fort Hall, Fort Boise, etc.)
 *
 * TODO Issue 2: wire generateDialogue for fort events
 * TODO Issue 4: wire useGameState fort phase
 */
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function FortScreen() {
  const { fortId } = useLocalSearchParams<{ fortId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {fortId ?? 'Unknown Fort'}
      </Text>
      <Text style={styles.placeholder}>Fort events — coming in Issue 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a00',
    padding: 24,
  },
  heading: {
    color: '#f5e6c8',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textTransform: 'capitalize',
  },
  placeholder: {
    color: '#8b6914',
    fontSize: 16,
  },
});
