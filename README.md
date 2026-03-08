# Whoreagon Trail

A Mel Brooks-style reimagining of Oregon Trail. A burlesque troupe of sex workers must cross the American frontier in 1848, performing shows at forts to fund the journey while holding their community together.

> "Comedy is not decoration. The comedy IS the message."

---

## Tech Stack

| Layer | Technology |
|---|---|
| App | React Native + Expo SDK 55 |
| Routing | Expo Router (file-based) |
| Build | EAS Build (APK/AAB) |
| Narrative AI | Anthropic API — claude-sonnet-4-20250514 |
| Map/Minigames | React Native Skia |
| State persistence | AsyncStorage |
| IAP | RevenueCat — $0.99/playthrough |
| Monorepo | Turborepo + npm workspaces |

---

## Monorepo Structure

```
WhoreagonTrail/
├── apps/
│   └── mobile/              # Expo app (Android-first)
│       ├── app/             # Expo Router screens
│       │   ├── index.tsx    # Entry / IAP gate
│       │   └── (game)/
│       │       ├── prologue.tsx
│       │       ├── trail.tsx
│       │       ├── setup/characters.tsx
│       │       └── fort/[fortId]/index.tsx
│       ├── app.json
│       └── eas.json
├── packages/
│   ├── game-engine/         # State machine, relationship engine, resource tick
│   ├── ai-client/           # Anthropic API wrapper + prompt templates
│   ├── characters/          # Character schema + stable of 20
│   └── assets/              # Typed asset references
├── turbo.json
├── package.json             # npm workspaces root
└── tsconfig.json
```

> **Legacy Unity files**: `Assets/` and `backend/` are preserved from a prior prototype. Do not modify them.

---

## Two-Window PowerShell Workflow

Open **two PowerShell terminals** in the `WhoreagonTrail/` root.

### Window 1 — Metro Bundler
```powershell
cd apps/mobile
npx expo start --android
```
Keeps the Metro JS bundler running. Connect your Android device via USB or start an emulator before running this.

### Window 2 — Dev Commands
Use this window for all other commands: installing packages, running type checks, committing, etc.

```powershell
# Install all workspace dependencies (run once after clone)
npm install

# Type-check the entire monorepo
npx tsc --noEmit

# Type-check with Turborepo (runs all package typechecks in dependency order)
npx turbo typecheck

# Verify Expo dependency versions are correct
cd apps/mobile && npx expo install --check && cd ../..
```

---

## First-Time Setup

```powershell
# 1. Clone
git clone https://github.com/AndyDrzewiecki/WhOregonTrail.git
cd WhOregonTrail

# 2. Install dependencies
npm install

# 3. Copy env file and add your keys
cp .env.example .env
# Edit .env: add EXPO_PUBLIC_ANTHROPIC_API_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY

# 4. Verify types compile
npx tsc --noEmit

# 5. Start Metro (Window 1)
cd apps/mobile
npx expo start --android
```

---

## EAS Build (ask before running — requires Expo account)

```powershell
cd apps/mobile

# Install EAS CLI (once)
npm install -g eas-cli

# Log in
eas login

# Development APK (sideload on device)
eas build --profile development --platform android

# Production AAB (for Play Store)
eas build --profile production --platform android
```

> Do not run EAS Build without confirming with the project lead. Builds consume EAS credits and require the correct `projectId` in `app.json`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | Yes | Anthropic API key from console.anthropic.com |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Yes (Issue 5) | RevenueCat Android public SDK key |

---

## Phase 1 Issues

| # | Title | Priority | Status |
|---|---|---|---|
| 1 | Monorepo scaffold + EAS baseline | P0 | Done |
| 2 | Anthropic API client + prompts | P0 | Pending |
| 3 | Character schema + stable (20 chars) | P0 | Pending |
| 4 | Core game state machine | P0 | Pending |
| 5 | RevenueCat IAP | P1 | Pending |

---

## AI Prompt Rules (enforced in packages/ai-client/prompts/)

1. Every system prompt opens with: *"Comedy is not decoration. The comedy IS the message. The serious moments land harder because of the jokes."*
2. Characters are never mouthpieces for themes. They react to **specific things that happened today**.
3. 1848 historical accuracy is non-negotiable. Do not modernize language or flatten the period.
4. Adult content: implication and context only. Never explicit description.

---

## License

MIT License