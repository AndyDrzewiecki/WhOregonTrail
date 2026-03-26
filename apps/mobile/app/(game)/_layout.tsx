import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a0a00' },
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="prologue" />
      <Stack.Screen name="campfire" />
      <Stack.Screen name="trail" />
      <Stack.Screen name="setup/characters" />
      <Stack.Screen name="setup/supplies" />
      <Stack.Screen name="fort/[fortId]/index" />
      <Stack.Screen name="minigame/[gameId]" />
      <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'fade' }} />
      <Stack.Screen name="finale" />
      <Stack.Screen name="end" />
    </Stack>
  );
}
