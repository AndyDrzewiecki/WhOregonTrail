# Whoreagon Trail

A Mel Brooks-style comedic Oregon Trail reimagining. 1848. A burlesque troupe heads west.

## Monorepo Structure

- `apps/mobile` — React Native / Expo (Android-first, production build)
- `apps/web` — Next.js 15 browser vertical slice (development / demo path)
- `packages/game-engine` — State machine, reducer, trail constants
- `packages/characters` — 20-character stable, OCEAN personalities, relationship system
- `packages/ai-client` — Claude API wrapper, streaming, prompts, retry logic

## Quick Start — Browser (Recommended for Demo)

```bash
# From repo root
npm install

# Set up environment
cd apps/web
cp .env.local.example .env.local
# Edit .env.local and add your Anthropic API key

# Run the browser slice
npm run dev
# Opens at http://localhost:3000
```

## Quick Start — Mobile (Android)

```bash
cd apps/mobile
npx expo start
# Press 'a' to open Android emulator
```

## Environment Variables

| App | Variable | Purpose |
|-----|----------|---------|
| `apps/web` | `NEXT_PUBLIC_ANTHROPIC_API_KEY` | Claude API key for browser |
| `apps/mobile` | `EXPO_PUBLIC_ANTHROPIC_API_KEY` | Claude API key for mobile |

Get a key at https://console.anthropic.com

## Development

```bash
npm run dev      # Run all apps (web + mobile Metro)
npm run build    # Build all packages
npm run lint     # Lint all packages
```

## Browser Vertical Slice — Scene Flow

The browser slice at `apps/web` is a 7-scene playable demo of the full game loop:

1. **Wagon Opener** — Skyrim-parody cold open, troupe in Independence
2. **Character Introductions** — Meet the party, first impressions
3. **Conflict** — Internal party conflict, player as captain/mediator
4. **Planning Mode** — Pace selection, resource management
5. **Gatekeeper** — Fort entry negotiation with a hostile NPC
6. **Minigame** — Browser-native performance/hunting mechanic
7. **Consequence Summary** — Campfire reflection on the day's events

## Architecture Notes

- `useGameState(adapter?)` accepts a storage adapter — `localStorage` for web, `AsyncStorage` for mobile
- All AI calls go through `packages/ai-client` — same code for both targets
- Voice input (push-to-talk) is optional in the browser; gracefully disabled if Web Speech API unavailable

---

## AI Prompt Rules (enforced in packages/ai-client/prompts/)

1. Every system prompt opens with: *"Comedy is not decoration. The comedy IS the message. The serious moments land harder because of the jokes."*
2. Characters are never mouthpieces for themes. They react to **specific things that happened today**.
3. 1848 historical accuracy is non-negotiable. Do not modernize language or flatten the period.
4. Adult content: implication and context only. Never explicit description.

---

## License

MIT License
