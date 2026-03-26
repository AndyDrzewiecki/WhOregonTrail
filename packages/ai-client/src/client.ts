/**
 * Anthropic client singleton.
 *
 * In React Native / Expo, `process.env.EXPO_PUBLIC_*` vars are injected
 * at build time by Metro. `dangerouslyAllowBrowser: true` is required
 * because RN is not a Node.js environment.
 *
 * The client is lazily initialised so it can be safely imported at module
 * load time without throwing if the env var hasn't been set yet (useful
 * in Storybook / tests where you want to import types without a real key).
 */

import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-sonnet-4-20250514' as const;
export const MAX_TOKENS = 1000 as const;

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (_client) return _client;

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.startsWith('sk-ant-api03-your-key')) {
    throw new Error(
      '[ai-client] EXPO_PUBLIC_ANTHROPIC_API_KEY or NEXT_PUBLIC_ANTHROPIC_API_KEY is missing or is still the placeholder value.\n' +
      'Copy .env.example → .env and add your real key from https://console.anthropic.com'
    );
  }

  _client = new Anthropic({
    apiKey,
    // Required for React Native — the SDK detects non-Node environments
    // and refuses to run without this flag as a safety acknowledgement.
    dangerouslyAllowBrowser: true,
  });

  return _client;
}

/** Reset the singleton — useful in tests / hot reload. */
export function resetClient(): void {
  _client = null;
}
