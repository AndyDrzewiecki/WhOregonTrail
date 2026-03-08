import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initRevenueCat } from '@/lib/iap';

export default function RootLayout() {
  useEffect(() => {
    initRevenueCat();
  }, []);

  return (
    <>
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
    </>
  );
}
