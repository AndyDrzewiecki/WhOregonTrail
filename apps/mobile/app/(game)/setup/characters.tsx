/**
 * CHARACTER SETUP SCREEN
 *
 * Player picks their starting party from the character stable.
 * Displays character cards: name, role, personality snippet.
 * Minimum party size: 4. Maximum: 6.
 *
 * TODO Issue 3: wire character stable data
 * TODO Issue 4: wire useGameState party initialization
 */
import { View, Text, StyleSheet } from 'react-native';

export default function CharacterSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose Your Troupe</Text>
      <Text style={styles.placeholder}>
        Character selection — coming in Issue 3
      </Text>
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
  },
  placeholder: {
    color: '#8b6914',
    fontSize: 16,
  },
});
