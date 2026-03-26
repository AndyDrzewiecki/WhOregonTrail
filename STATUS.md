# Whoreagon Trail — Project Status

**Last updated:** Sprint 6 complete

---

## What's Built

### Core Architecture
- TypeScript Turborepo monorepo: `apps/web` (Next.js 15.5), `apps/mobile` (Expo), `packages/game-engine`, `packages/characters`, `packages/ai-client`
- Shared reducer with `GameState`, `HiddenState` (6 invisible fields: protection, stigmaPressure, indebtedness, resentment, obedience, boundaryStrain), and `RouteProfile`
- StorageAdapter pattern for web/mobile persistence

### Game Loop (apps/web)
- Scene router: WagonOpener → CharacterIntroductions → Planning → Conflict → Coaching *(conditional)* → Delegation *(conditional)* → Gatekeeper / EntertainmentCircuit → Minigame → ConsequenceSummary
- Three route types: **fort_route**, **wilderness_route**, **entertainment_circuit** — each with distinct external pressures and internal consequences
- AI-driven dialogue via Anthropic SDK with streaming; all prompts enriched with game state context

### Consequence Propagation (Sprint 5)
- **RunMemory system**: structured per-run event log (≤20 events) recording decisions, approaches, and sentiment. Types: `route_chosen`, `gatekeeper_outcome`, `conflict_outcome`, `coaching_moment`, `boundary_crossed/defended`, `performance_outcome`, `sacrifice_made`
- Memory visible to all scenes — later scenes reference earlier decisions specifically
- `gameStateToUserMessage` enriched with: route, socialPressure summary, roleAssignment, memoryContext (recent labels, boundary flags, protected/used people)

### Scenes
| Scene | Status | Notes |
|-------|--------|-------|
| WagonOpener | ✅ | Cold open prologue |
| CharacterIntroductions | ✅ | Dynamic from `state.party` |
| PlanningMode | ✅ | Route choice, pace, role assignment; records `route_chosen` to RunMemory |
| ConflictScene | ✅ | Spotlight variation, route chain callbacks, prior-outcome callbacks |
| CoachingScene | ✅ | Pre-fort pull-aside with lowest-relationship party member; fires when resentment/strain above threshold |
| DelegationScene | ✅ | Pre-encounter role assignment (Speaker/Backup/Observer/Enforcer); fires once per day when party has 2+ non-player alive members; roles flow into Gatekeeper and EntertainmentCircuit AI context |
| GatekeeperScene | ✅ | Route chain, coaching callback, delegation context, stigmaPressure variants |
| EntertainmentCircuitScene | ✅ | Performance negotiation; delegation context; arc flags (EARLY/MID/LATE); transitions to CAMPFIRE |
| MinigameInterruption | ✅ | Rhythm/timing/hunting lightweight minigames |
| ConsequenceSummary | ✅ | 3-exchange campfire; 6-branch leadership reflection; memory/boundary callbacks; "Run it again" + "Break camp" buttons |

### Sprint 6 — Browser Loop Hardening
- Added **DelegationScene**: pre-encounter role-assignment screen firing between Coaching and Gatekeeper/EntertainmentCircuit
- DelegationScene roles (Speaker, Backup, Observer, Enforcer) surface as context in Gatekeeper and EntertainmentCircuit AI prompts
- Fixed DelegationScene `handleGoIn`: removed dead if/else branches (both sides dispatched identical action); now single clean dispatch
- Fixed GatekeeperScene header status label: was displaying "ENTRY DENIED" before negotiation started; now shows "AT THE GATE" (neutral) until player speaks
- "Run it again" button in ConsequenceSummary confirmed working: dispatches `START_RUN` with current party, resets all resources and flags, restarts from PROLOGUE
- Entertainment Circuit money gate documented: requires `resources.money > 40`; default is 0, so the option doesn't appear until mid-run
- Scene router priority confirmed: COACHING → DELEGATION → ENTERTAINMENT_CIRCUIT / GATEKEEPER (correct order)
- All scene null guards verified: every scene returns null if `state` is null; SceneBridge returns null if state is null

### Polish
- **SceneBridge**: day/location/route continuity bar above every scene; includes DELEGATION bridge line
- **DebugHUD**: Ctrl+D overlay (dev-only) — hidden state, RunMemory, flags
- **spotlightUtils**: `selectSpotlightCharacter` + `buildSpotlightSignal` for party-memory variation
- **SceneTransition**: animated scene transitions
- **Voice input**: Chrome/Edge only, optional, transcript feeds same pipeline as text

---

## How to Run

```bash
npm install --no-package-lock
cd apps/web
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key npm run dev
```

See `PLAYTEST.md` for full guide.

---

## Sprint History

| Sprint | Summary |
|--------|---------|
| Sprint 1–3 | Core architecture, game loop, initial scenes |
| Sprint 4 | Trail loop, campfire, finale, end screens |
| Sprint 5 | Polish and depth — RunMemory, AI prompts, route arc flags, events, minigames |
| Sprint 6 | Browser loop hardening — DelegationScene, routing audit, status label bug fix, PLAYTEST/STATUS docs updated |

---

## Known Issues

| Issue | Workaround |
|-------|-----------|
| Production build fails on Windows (path-casing duplicate React) | Use `npm run dev` |
| npm 11 canDedupe crash with react-native-screens nightly | `--no-package-lock` flag |
| Entertainment Circuit route locked behind money > $40 gate | Won't appear on Day 1; testers need mid-run money |
| No cross-session save/load beyond localStorage | Refresh restores run; clearing site data resets it |
