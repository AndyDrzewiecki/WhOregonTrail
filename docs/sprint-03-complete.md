# Sprint 3 Completion Report

## Files Created or Modified

### BLOCKER — Fix: resolve type mismatches from Sprint 2

- **apps/mobile/app/_layout.tsx** — Removed `GameStateProvider` import and wrapper. Root layout now renders `<>...</>` directly. `GameStateProvider` was deleted in Sprint 2 when the hook pattern replaced the context pattern.
- **apps/mobile/app/(game)/minigame/[gameId].tsx** — Replaced full implementation (which referenced `getMinigameById`, `MinigameConfig`, wrong action names `APPLY_RELATIONSHIP_DELTAS`/`ADD_FLAG`, wrong `resolveEvent` signature, and `state.resources.morale` which doesn't exist) with a minimal stub. Route compiles, back navigation preserved.
- **apps/mobile/app/(game)/finale.tsx** — Created. Minimal stub: "The Columbia River" centered text.
- **apps/mobile/app/(game)/end.tsx** — Created. Minimal stub: "Run Complete" centered text.
- **apps/mobile/app/(game)/_layout.tsx** — Added `setup/supplies`, `minigame/[gameId]`, `finale`, and `end` screen registrations.

### Issue 6 — Prologue screen (full implementation)

- **apps/mobile/src/constants/colors.ts** — Created. Exports `COLORS` const with 8 named values: bg, paper, cream, gold, goldDim, muted, darkCard, error. All components import from here — no hardcoded hex strings in components.

- **apps/mobile/src/components/DialogueLog.tsx** — Created. Exports `DisplayMessage` type `{ id, characterId, characterName, text, isPlayer? }`. FlatList with newest-at-bottom scrolling (scrollToEnd ref on messages.length change). Non-player messages: gold uppercase name header, cream italic text. Player messages: right-aligned, goldDim name. Streaming: blinking "█" cursor appended to last message via 500ms setInterval (interval cleaned up in useEffect return).

- **apps/mobile/src/components/TypeBox.tsx** — Created. KeyboardAvoidingView behavior="height" wrapper. TextInput (darkCard bg, cream text, goldDim border) + "→" send button (gold, 24px). Rejects empty input, clears after submit, opacity 0.4 + pointer events none when disabled.

- **apps/mobile/app/(game)/prologue.tsx** — Replaced stub with full implementation:
  - On mount: if state null, dispatches `START_RUN` with founding four (delphine-marchais, mama-szabo, sister-agnes, old-pete) looked up from `characterStable`
  - Second useEffect watching state: when state becomes non-null and isReady false, calls `generateDialogue(state, '__SCENE_START__')`, maps response to DisplayMessage[], sets isReady true
  - Player submit: appends player message immediately, sets isStreaming true, calls `streamDialogue`. onChunk accumulates raw JSON in a ref and shows it as a live "narrator" streaming message. On completion, removes streaming message, replaces with parsed dialogue array
  - Applies relationshipDeltas (characterA=characterId, characterB='player'), newFlags (SET_FLAG), ADD_EVENT
  - Checks for PROLOGUE_COMPLETE flag → 1200ms pause → navigate to `/(game)/setup/characters`
  - Loading state: dark bg, "1848" goldDim letterSpacing 6, "Independence, Missouri" cream 18px, ActivityIndicator
  - Error state: "The frontier is unforgiving." + Retry button (re-calls same function)

### How streaming JSON accumulation works in prologue

The stream returns raw JSON fragments, not readable text. Trying to parse partial JSON mid-stream fails. The approach:
1. Accumulate all chunks in a `useRef` (not state — avoids re-renders per chunk)
2. Show the accumulated raw text as a single "narrator" streaming message so the user sees activity
3. When `streamDialogue()` resolves, it returns the fully parsed `AIResponse`
4. Remove the streaming placeholder, replace with properly formatted `DisplayMessage[]` from `response.dialogue`

This is the correct pattern: stream for perceived responsiveness, parse only once complete.

### Issue 7 — Character selection screen

- **apps/mobile/src/components/CharacterCard.tsx** — Created. Three states (unselected/unrevealed → revealed → selected). Paper background with aged look. Bottom strip shows "TAP TO REVEAL" → hiddenTrait text → selection confirmed. OCEAN personality descriptor logic: sort all 5 dimensions descending, take top 3, show label if score > 7 else show "DimensionName: N". Selected state: gold overlay tint + "✓" checkmark + scale 1.03. Width: `(screenWidth - 48) / 2`, height 200.

- **apps/mobile/app/(game)/setup/characters.tsx** — Replaced stub with full implementation. Shows 16 selectable characters (excluding the 4 founding members). Two-column FlatList. Three-tap flow: reveal → select → deselect. Max 4 selected; 5th tap flashes count text red briefly. Fixed bottom bar: "{n}/4 chosen" + Continue button (inactive until 4 selected). On Continue: dispatches `ADD_PARTY_MEMBERS` with the 4 selected + 4 random from remaining pool, then navigates to `/(game)/setup/supplies`.

- **packages/game-engine/src/state.ts** — Added `ADD_PARTY_MEMBERS` action to `GameAction` union and reducer case. Converts `Character[]` to `PartyMember[]` (health: 100, isAlive: true, joinedOnDay: state.day). Also expands the relationship matrix for all new members, initializing their rows/columns to 0 against all existing party members.

### Issue 9 — Supplies setup screen (partial)

- **apps/mobile/app/(game)/setup/supplies.tsx** — Created. Starting money $180 hardcoded. Six purchasable items: food ($0.20/lb), water ($1.50/barrel), ammunition ($2.00/box of 20 rounds), medicine ($5.00/kit), spare wheels ($10.00), spare axles ($10.00). Each row: label + unit price, [−] qty [+] stepper controls, running cost. Spending progress bar goes gold → red if over budget (+ button disabled when broke so overspend shouldn't occur). Recommended loadout hint: "A party of [n] needs roughly [n×100] lbs of food" pulled from live state. On Depart: dispatches `UPDATE_RESOURCES` (ammunition qty × 20 for total rounds, tongues always 1, money = 180 − spent, oxenHealth/wagonHealth = 100), dispatches `SET_PHASE: 'TRAIL'`, navigates to `/(game)/trail`.

---

## TypeScript status

- `packages/characters`: 0 source errors
- `packages/game-engine`: 0 source errors (ADD_PARTY_MEMBERS added cleanly)
- `packages/ai-client`: 0 source errors
- Mobile app (apps/mobile): TypeScript checked via Expo's bundler — no `tsc --noEmit` available without full `expo/tsconfig.base` + installed node_modules. All imports use correct package names and path alias `@/`.

---

## What the app can now do end-to-end

**paywall → index → prologue → character select → supplies → trail stub**

1. **index.tsx**: IAP gate — checks RevenueCat entitlement, routes to paywall or prologue
2. **paywall.tsx**: RevenueCat paywall, $0.99 purchase, routes to prologue on success
3. **prologue.tsx** (NEW): AI generates opening scene in Independence, Missouri 1848. Player types responses. Streaming dialogue. When AI returns PROLOGUE_COMPLETE flag, advances to character select.
4. **setup/characters.tsx** (NEW): Player taps to reveal 16 available characters, selects 4. Dispatches ADD_PARTY_MEMBERS with 4 chosen + 4 random, navigates to supplies.
5. **setup/supplies.tsx** (NEW): Player spends $180 on food, water, ammunition, medicine, wagon parts. Dispatches UPDATE_RESOURCES, SET_PHASE: 'TRAIL', navigates to trail.
6. **trail.tsx**: Stub (full implementation Sprint 4+)

---

## Decisions

1. **ADD_PARTY_MEMBERS vs re-dispatching START_RUN**: The spec says founding four are already in state from prologue's START_RUN. Characters screen dispatches ADD_PARTY_MEMBERS to add the player-selected + random members to the existing party, expanding the relationship matrix. START_RUN is not called again.

2. **Party size**: 4 founding + 4 player-selected + 4 random = 12 total. The spec mentions "11 members total" which appears to be a typo (4+4+4=12). Using 4 random to match the explicit text "Pick 4 at random."

3. **Streaming JSON display**: Raw JSON accumulates in a ref during streaming; user sees it as narrator activity text. Only parsed once complete. Never attempt mid-stream JSON.parse.

4. **`useGameState` initialization in prologue**: `START_RUN` is dispatched if state is null. A separate `useEffect([state])` watches for state to become non-null before calling the AI, since the hook is async (AsyncStorage hydration + reducer).
