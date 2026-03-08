import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GameStateProvider } from '@whoreagon-trail/game-engine';
import { initRevenueCat } from '@/lib/iap';

export default function RootLayout() {
  useEffect(() => {
    initRevenueCat();
  }, []);

  return (
    <GameStateProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a0a00' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="(game)" />
      </Stack>
      <StatusBar style="light" />
    </GameStateProvider>
  );
}
