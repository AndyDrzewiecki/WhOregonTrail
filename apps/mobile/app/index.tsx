/**
 * Entry point — IAP gate.
 *
 * Checks SecureStore for a valid run token.
 * - No token   → /paywall
 * - Has token  → /(game)/prologue
 *
 * The run token is written by paywall.tsx after a successful purchase.
 * It is consumed (deleted) when a new run begins in the prologue,
 * so each $0.99 purchase grants exactly one playthrough.
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { RUN_TOKEN_KEY } from '@/lib/iap';

type Gate = 'checking' | 'paywall' | 'play';

export default function Index() {
  const [gate, setGate] = useState<Gate>('checking');

  useEffect(() => {
    async function check() {
      try {
        const token = await SecureStore.getItemAsync(RUN_TOKEN_KEY);
        setGate(token ? 'play' : 'paywall');
      } catch {
        // SecureStore failure — send to paywall, not play
        setGate('paywall');
      }
    }
    check();
  }, []);

  if (gate === 'checking') {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a0a00', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#8b6914" />
      </View>
    );
  }

  if (gate === 'paywall') {
    return <Redirect href="/paywall" />;
  }

  return <Redirect href="/(game)/prologue" />;
}
