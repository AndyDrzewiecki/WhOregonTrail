# Whoreagon Trail — Browser

Next.js 15 browser-first vertical slice. Runs the same game-engine and AI client packages as the mobile app.

## Quick Start — Web Demo (Browser Playtest)

### Requirements
- Node.js 20+
- Anthropic API key

### Setup
```bash
# From repo root (IMPORTANT: run from repo root, not apps/web)
npm install --no-package-lock

# Set your API key
export NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key_here
# Windows: set NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key_here

# Start the web app
cd apps/web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Known Issues
- **Production build on Windows**: `npm run build` fails with a Windows path casing issue in Next.js 15 prerendering. Use `npm run dev` for local playtest — it works fully. Production build requires running from PowerShell/cmd.exe with canonical Windows paths, not Git Bash — or deploy to Vercel for zero-config production builds.
- **Mobile app**: Expo/React Native build requires `apps/mobile/node_modules` installed separately (`cd apps/mobile && npx expo install`).

### What to expect
- Full 7-scene loop: Prologue → Character Introductions → Planning → Trail → Conflict → Campfire → Repeat
- Route selection (Fort Route, Wilderness Route, Entertainment Circuit) shapes encounters
- Voice input (Chrome/Edge): hold mic button to speak
- ~15-20 minutes per run

## Setup (legacy)

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
