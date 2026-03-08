/**
 * @whoreagon-trail/assets
 *
 * Sprite sheets, audio cues, and font references.
 * Images live in apps/mobile/assets/ — this package
 * exports typed references so other packages don't
 * hardcode paths.
 *
 * Populated as art assets are created.
 */

export const ASSETS = {
  // Placeholder — populated as art assets are added
  sprites: {} as Record<string, unknown>,
  audio: {} as Record<string, unknown>,
} as const;
