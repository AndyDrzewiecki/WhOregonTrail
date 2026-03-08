/**
 * PAYWALL SCREEN
 *
 * Shown before the first run. $0.99 consumable — one playthrough.
 * Token stored in SecureStore after successful purchase.
 *
 * RevenueCat product: com.whoreagontrail.playthrough
 */

import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { RUN_TOKEN_KEY, REVENUECAT_ENTITLEMENT } from '@/lib/iap';

type PaywallState = 'loading' | 'ready' | 'purchasing' | 'error';

export default function PaywallScreen() {
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [uiState, setUiState] = useState<PaywallState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadOffering() {
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current;
        if (current?.availablePackages.length) {
          setPkg(current.availablePackages[0] ?? null);
        }
        setUiState('ready');
      } catch (err) {
        console.error('[paywall] Failed to load offerings:', err);
        setUiState('error');
        setErrorMsg('Could not reach the store. Check your connection.');
      }
    }
    loadOffering();
  }, []);

  async function handlePurchase() {
    if (!pkg) return;
    setUiState('purchasing');
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT]) {
        // Write a run token to SecureStore so index.tsx can gate on it
        const token = `run_${Date.now()}`;
        await SecureStore.setItemAsync(RUN_TOKEN_KEY, token);
        router.replace('/(game)/prologue');
      } else {
        throw new Error('Purchase completed but entitlement not active.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Purchase failed.';
      // RevenueCat throws a specific error code when user cancels
      const isCancelled =
        msg.includes('userCancelled') || msg.includes('1');
      if (!isCancelled) {
        setErrorMsg(msg);
        setUiState('error');
      } else {
        setUiState('ready');
      }
    }
  }

  async function handleRestore() {
    setUiState('purchasing');
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT]) {
        const token = `run_restored_${Date.now()}`;
        await SecureStore.setItemAsync(RUN_TOKEN_KEY, token);
        router.replace('/(game)/prologue');
      } else {
        setErrorMsg('No previous purchase found to restore.');
        setUiState('error');
      }
    } catch (err) {
      console.error('[paywall] Restore failed:', err);
      setErrorMsg('Restore failed. Try again.');
      setUiState('error');
    }
  }

  const price = pkg?.product.priceString ?? '$0.99';

  return (
    <View style={styles.container}>
      <Text style={styles.year}>1848</Text>
      <Text style={styles.title}>Whoreagon Trail</Text>

      <View style={styles.pitchBlock}>
        <Text style={styles.pitch}>
          One wagon. One troupe. Two thousand miles of frontier.
        </Text>
        <Text style={styles.subpitch}>
          A single playthrough costs {price} — about the same as the arcade, but with more dysentery.
        </Text>
        <Text style={styles.subpitch}>
          Each run is roughly one hour. No ads. No subscriptions. No saving the trail for later — the frontier does not offer that option.
        </Text>
      </View>

      {uiState === 'loading' && (
        <ActivityIndicator color="#8b6914" size="large" />
      )}

      {(uiState === 'ready' || uiState === 'purchasing') && (
        <>
          <Pressable
            style={[styles.button, uiState === 'purchasing' && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={uiState === 'purchasing'}
          >
            {uiState === 'purchasing' ? (
              <ActivityIndicator color="#f5e6c8" />
            ) : (
              <Text style={styles.buttonText}>Begin for {price}</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={uiState === 'purchasing'}
          >
            <Text style={styles.restoreText}>Restore Previous Purchase</Text>
          </Pressable>
        </>
      )}

      {uiState === 'error' && (
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Pressable
            style={styles.button}
            onPress={() => setUiState('ready')}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      )}
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
    fontSize: 12,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#f5e6c8',
    fontSize: 38,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  pitchBlock: {
    marginBottom: 40,
    gap: 12,
  },
  pitch: {
    color: '#f5e6c8',
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 26,
  },
  subpitch: {
    color: '#c9a96e',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    borderWidth: 1,
    borderColor: '#8b6914',
    paddingHorizontal: 40,
    paddingVertical: 16,
    minWidth: 220,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#f5e6c8',
    fontSize: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  restoreButton: {
    padding: 12,
  },
  restoreText: {
    color: '#8b6914',
    fontSize: 13,
    textDecoration: 'underline',
  } as unknown as object,
  errorBlock: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#c44',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
});
