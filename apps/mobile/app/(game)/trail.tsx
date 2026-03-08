/**
 * TRAIL SCREEN
 *
 * The main travel loop. Displays:
 * - Map (React Native Skia canvas — Issue 4+)
 * - Resource bar (food, water, medicine, money, morale)
 * - Day counter
 * - Random event trigger zone
 *
 * TODO Issue 4: wire useGameState
 * TODO: wire Skia trail map renderer
 * TODO Issue 2: wire resolveEvent for trail events
 */
import { View, Text, StyleSheet } from 'react-native';

export default function TrailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Trail — coming in Issue 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    color: '#8b6914',
    fontSize: 16,
  },
});
