# Whoreagon Trail

A Mel Brooks-style Oregon Trail about a burlesque troupe heading west. 1848. Two thousand miles. No guarantees.

## Play Now

**Fastest path:** Deploy to Vercel (zero config). Or run locally:

```bash
cd apps/web
cp .env.local.example .env.local
# Edit .env.local — add your Anthropic API key:
#   NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...

npm install
npm run dev
# Open http://localhost:3000
```

Get an API key: https://console.anthropic.com

---

## How to Play

1. **The Wagon Opener** — You're hired to lead Delphine Marchais's troupe west. Read the cold open, then talk to Delphine.
2. **Character Introductions** — Meet your party. They have opinions. Some of them don't like each other yet.
3. **Supply Shop** — Buy food, water, medicine, wagon parts. You will not have enough money for everything.
4. **Planning Mode** — Each day, choose your pace (rest / steady / grueling) and manage the wagon. Events happen. Some of them are bad.
5. **Forts** — Every waypoint has a gate. Negotiate entry. The gatekeeper has opinions about your wagon.
6. **Coaching / Delegation** — Before a fort, you can coach a party member or delegate responsibility. Affects hidden state.
7. **Entertainment Circuit** — If you chose this route, each fort is a venue. Perform. Get paid. Accumulate debt.
8. **Consequence Summary** — Campfire at the end of each day. The AI reflects on what happened. You can respond.
9. **Oregon City** — Arrive, get scored, read the epilogue. Play again.

### Tips
- Food and water are per-party-member per day. A grueling pace burns more.
- Hidden state (protection, resentment, boundary strain) affects what the AI says and how scenes unfold.
- The route you choose shapes the whole run. Fort Route = paperwork and respectability. Wilderness = no witnesses. Entertainment Circuit = debt and reputation.
- Characters die. Save often (`↓ save` button, bottom-right).

---

## Scoring

At Oregon City, your run is scored 0–100:

| Category | Weight | Notes |
|---|---|---|
| Survival rate | 45% | % of party alive at arrival |
| Resources | 20% | Food, water, money, wagon health |
| Protection | 20% | How protected the party felt |
| Resentment | −15% | Penalty for high resentment |

**Grades:** S (≥80) / A (≥65) / B (≥48) / C (≥30) / D (below 30)

---

## Monorepo Structure

```
apps/web          — Next.js 15 browser app (primary play surface)
apps/mobile       — React Native / Expo (Android)
packages/
  game-engine     — State machine, reducer, scoring, trail constants
  characters      — 20-character stable, OCEAN personalities
  ai-client       — Claude API wrapper, streaming, prompts
```

## Development

```bash
npm install         # Install all workspaces
npm run dev         # Run web + mobile Metro
npm run build       # Build all packages
npm run test        # Run game-engine unit tests (89 tests)
```

**Production web build:** Run from PowerShell (not Git Bash) on Windows:
```powershell
cd apps/web
npm run build
```
Git Bash path mangling causes a Next.js 15 prerender error on Windows. Use PowerShell or deploy to Vercel.

---

## AI Prompt Rules

1. Comedy is not decoration. The comedy IS the message.
2. Characters react to specific things that happened today — not generic hardship.
3. 1848 historical accuracy is non-negotiable. No modern language.
4. Adult content: implication and context only. Never explicit.

---

## License

MIT
