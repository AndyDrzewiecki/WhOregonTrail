/**
 * MINIGAME SCREEN — placeholder
 * Full implementation in Issue 8 (burlesque performance) and Issue 11 (hunting).
 * This stub exists so the route compiles and navigation does not break.
 */
import { View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function MinigameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: '#1a0a00', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ color: '#8b6914', fontSize: 12, letterSpacing: 4, marginBottom: 16 }}>MINIGAME</Text>
      <Text style={{ color: '#f5e6c8', fontSize: 20, fontWeight: 'bold', marginBottom: 32 }}>{gameId ?? '—'}</Text>
      <Pressable
        style={{ borderWidth: 1, borderColor: '#8b6914', paddingHorizontal: 32, paddingVertical: 14 }}
        onPress={() => router.back()}
      >
        <Text style={{ color: '#f5e6c8', fontSize: 14, letterSpacing: 3 }}>BACK</Text>
      </Pressable>
    </View>
  );
}
