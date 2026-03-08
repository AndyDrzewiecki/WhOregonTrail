# Sprint 2 Completion Report

## Files Created or Modified

### Issue 2 — AI Client + Prompt Template System

- **packages/ai-client/src/index.ts** — Rewritten. Exports `generateDialogue`, `resolveEvent`, `generateEpilogue`, `streamDialogue` with new signatures taking `GameState` directly. All types exported: `Message`, `AIResponse`, `EventOutcome`, `StressTag`, `TrailEvent`. Safe fallback on JSON parse failure.
- **packages/ai-client/src/prompts/prologue.ts** — Created. Saloon in Independence, Missouri, 1848.
- **packages/ai-client/src/prompts/trail.ts** — Created. Wagon moving, resources finite, close proximity.
- **packages/ai-client/src/prompts/fort.ts** — Created. Fort arrival, outsiders needing things, performance as armor.
- **packages/ai-client/src/prompts/campfire.ts** — Created. Night on the trail, quiet revelations.
- **packages/ai-client/src/prompts/finale.ts** — Created. Columbia River, character arc resolution, tombstone-style epilogues.
- **packages/ai-client/src/client.ts** — Unchanged. Singleton Anthropic client, model `claude-sonnet-4-20250514`.
- **packages/ai-client/package.json** — Added `@whoreagon-trail/game-engine` dependency.

**Removed:**
- `src/types.ts` — Folded into index.ts.
- `src/generateParty.ts` — Not in sprint 2 spec.
- `src/prompts/base.ts`, `dialogue.ts`, `epilogue.ts` — Replaced by 5 phase-specific prompts.

### Issue 3 — Character Schema + 20 Characters

- **packages/characters/src/schema.ts** — Rewritten. `Character` type with `personality: { O, C, E, A, N }` (1-10 scale), `background` field, `createRelationshipMatrix`, `getRelationshipLabel` (10-tier mapping from -100 to +100).
- **packages/characters/src/index.ts** — Rewritten. Exports schema types, `characterStable`, `createRelationshipMatrix`, `getRelationshipLabel`.
- **packages/characters/src/stable/index.ts** — Created. Barrel export of all 20 characters as `characterStable` array.
- **packages/characters/src/stable/*.ts** — 20 character files created (see below).

**Removed:**
- `src/archetypes.ts` — Not in sprint 2 spec (AI-generated characters replaced by fixed stable).
- All old stable characters (Big Agnes Calloway, Colonel Beaumont Price, etc.).

### Issue 4 — Core Game State Machine

- **packages/game-engine/src/state.ts** — Rewritten. Contains all types (`Phase`, `ResourceState`, `PartyMember`, `StressTag`, `EventHistoryEntry`, `TrailLocation`, `GameState`, `GameAction`), constants (`DEFAULT_RESOURCES`, `CONSUMPTION_RATES`, `TRAIL_WAYPOINTS`), the `gameReducer`, and the `useGameState()` hook with AsyncStorage persistence.
- **packages/game-engine/src/index.ts** — Rewritten. Exports everything from state.ts including `getRelationshipLabel` re-export.
- **packages/game-engine/package.json** — Added `@whoreagon-trail/characters` dependency, `@react-native-async-storage/async-storage` peer dependency.

**Removed:**
- `src/GameStateProvider.tsx` — Replaced by `useGameState` hook in state.ts.
- `src/useGameState.ts` — Moved into state.ts.
- `src/constants.ts` — Constants moved into state.ts.
- `src/minigames.ts` — Not in sprint 2 spec.

---

## Decisions Made Where Spec Was Ambiguous

1. **Import paths**: The spec used shorthand like `from 'characters'` — used full workspace package names (`@whoreagon-trail/characters`, `@whoreagon-trail/game-engine`) to match package.json `name` fields.

2. **TrailEvent type**: Not defined in the spec but used in `resolveEvent()` signature. Defined as `{ type: string; description: string; involvedCharacterIds?: string[] }` in ai-client.

3. **useGameState hydration strategy**: The spec said "returns null if no saved state" and "persisted on every state change." Implemented with `useState` + `useReducer` pattern: loads from AsyncStorage on mount, returns `null` until hydrated, then persists every reducer state change. After a `START_RUN` dispatch, switches from saved state to live reducer state.

4. **getRelationshipLabel thresholds**: The spec showed score ranges with arrows but left the exact boundary conditions ambiguous (inclusive vs exclusive). Used `<= -60` for Mortal Enemy, `<= -40` for Enemy, etc., consistent with the range chart.

5. **EventOutcome type**: The spec's AIResponse type showed `eventOutcome: EventOutcome` but the existing code used a string union. Implemented as the spec's object type: `{ result: 'success' | 'partial_success' | 'failure'; description: string; resourceChanges?: Partial<ResourceState> }`.

6. **END_RUN action**: Spec said "Clear AsyncStorage key `game:currentRun`". Implemented as fire-and-forget `AsyncStorage.removeItem()` within the reducer and also sets phase to `'END'`.

7. **Stale files**: Removed `GameStateProvider.tsx`, old `useGameState.ts`, `constants.ts`, and `minigames.ts` from game-engine since they referenced old types and the new index.ts doesn't export from them. The minigames registry can be re-added in a future sprint if needed.

---

## Strongest Dramatic Pairings (Top 3)

1. **Sister Agnes + Reverend Cain** — She knows he was defrocked. He doesn't know she knows. They're both people of faith who've been cast out by the institution, but one is at peace with it and the other is in denial. Every conversation between them is a landmine.

2. **Crow Feather + Mary Two Rivers** — They know each other from opposite sides of a conflict (Lakota/Shoshone). She's an Army informant. He's on a secret mission. Neither knows the other's secret, but the old wound between them is unresolved. And they're stuck in the same wagon.

3. **Jin Wei + Sun Li** — He thinks she's his sister. She's not. The entire relationship is built on a lie that she maintains out of devotion — but what happens when the truth comes out, and what does it mean that he never questioned it?

**Honorable mention**: Grace Chen (skimming from the troupe) + Delphine Marchais (owns the entire operation). When Delphine finds out, it won't be about the money.

---

## TypeScript Issues

- **TS2688 ambient type definition warnings**: All three packages show `Cannot find type definition file for 'babel__core'`, `react`, `node`, etc. These are from incomplete `node_modules` in the dev environment (missing `@types/*` packages). They do NOT indicate source code problems and will resolve when `npm install` completes in a full environment.
- **No source code type errors** in any of the three packages.
- **Import chain verified**: `characters` → `game-engine` → `ai-client` (no circular dependencies).
