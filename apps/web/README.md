# Whoreagon Trail — Browser

Next.js 15 browser-first vertical slice. Runs the same game-engine and AI client packages as the mobile app.

## Setup

```bash
cp .env.local.example .env.local
# Add NEXT_PUBLIC_ANTHROPIC_API_KEY to .env.local

npm install
npm run dev
```

Opens at http://localhost:3000

## Scene Flow

WagonOpener → CharacterIntroductions → PlanningMode → ConflictScene → GatekeeperScene → MinigameInterruption → ConsequenceSummary

Scene routing is handled by `src/hooks/useSceneRouter.ts` based on `GameState.phase` and flags.

## Voice Input

Push-to-talk is supported in Chrome and Edge via Web Speech API. Hold the ◉ button to speak. The transcript appears in the text bar and can be edited before sending. Automatically falls back to text-only on unsupported browsers (Firefox, Safari < 17.1).

## Key Files

- `src/app/game/page.tsx` — Scene router
- `src/hooks/useWebGameState.ts` — localStorage-backed game state
- `src/hooks/useSceneRouter.ts` — Phase → scene mapping
- `src/components/CommandBar.tsx` — Unified text + voice input
- `src/scenes/` — All 7 scene components

## Type Notes

- `GameAction.SET_PHASE` accepts `phase: Phase` — CAMPFIRE is now a valid phase
- `EventOutcome` from game-engine includes `relationshipDeltas` and `newFlags`; ai-client's `AIResponse.eventOutcome` does not — scenes map manually
- `PromptKey` type is exported from `@whoreagon-trail/ai-client` for typed prompt overrides
