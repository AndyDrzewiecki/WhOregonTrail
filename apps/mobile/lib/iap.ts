/**
 * IAP constants and initialisation.
 *
 * Call initRevenueCat() once, from the root _layout.tsx, before any
 * RevenueCat API calls are made.
 */

import Purchases from 'react-native-purchases';

/** SecureStore key for the current run token */
export const RUN_TOKEN_KEY = 'whoreagontrail:run_token' as const;

/** RevenueCat entitlement ID (configure in the RC dashboard) */
export const REVENUECAT_ENTITLEMENT = 'playthrough' as const;

/** RevenueCat product ID */
export const PRODUCT_ID = 'com.whoreagontrail.playthrough' as const;

export function initRevenueCat(): void {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

  if (!apiKey || apiKey.startsWith('your-revenuecat')) {
    if (__DEV__) {
      console.warn(
        '[iap] EXPO_PUBLIC_REVENUECAT_ANDROID_KEY not set. ' +
        'IAP will not function. Add to .env for testing.'
      );
    }
    return;
  }

  Purchases.configure({ apiKey });
}
