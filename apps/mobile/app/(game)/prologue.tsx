/**
 * PROLOGUE SCREEN
 *
 * Sets the stage: 1848, Missouri, the troupe is forming.
 * AI generates a short opening monologue (Mel Brooks tone).
 * Player taps through to character setup.
 *
 * TODO Issue 4: wire useGameState to initialize run
 * TODO Issue 2: wire generateDialogue for opening narration
 */
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function PrologueScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.year}>1848</Text>
      <Text style={styles.title}>Whoreagon Trail</Text>
      <Text style={styles.subtitle}>
        A burlesque troupe. A wagon. The entire American frontier.
        {'\n'}What could go wrong?
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => router.push('/(game)/setup/characters')}
      >
        <Text style={styles.buttonText}>Begin the Journey</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a00',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  year: {
    color: '#8b6914',
    fontSize: 14,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: 'serif',
  },
  title: {
    color: '#f5e6c8',
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: '#c9a96e',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    fontStyle: 'italic',
  },
  button: {
    borderWidth: 1,
    borderColor: '#8b6914',
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#f5e6c8',
    fontSize: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
