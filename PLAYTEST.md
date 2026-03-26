# Whoreagon Trail — Browser Playtest Guide

**What this is:** A browser-playable demo of Whoreagon Trail, a Mel Brooks-style 1848 Oregon Trail reimagining where you captain a burlesque troupe across the frontier.

## Quick Start

### Requirements
- Node.js 20+
- An Anthropic API key ([get one here](https://console.anthropic.com))
- A modern browser (Chrome/Edge for voice input; Firefox/Safari text-only)

### Launch
```bash
# From the repo root
npm install --no-package-lock
cd apps/web
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key_here npm run dev
```
**Windows (PowerShell/cmd):**
```
set NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key_here
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## What to Expect

**A full run takes ~20-30 minutes.** The loop:

1. **Prologue** — Scene-setting cold open
2. **Character Introductions** — Meet who you're leading. Address them.
3. **Planning** — Choose pace, route (Fort/Wilderness/Entertainment Circuit), role assignment
4. **Trail** — Events, conflicts, minigames
5. **Campfire** — End-of-day processing. Characters react to what happened.
6. Repeat until Oregon.

**Route choice matters.** Each route has different external pressures and internal consequences. You'll feel them.

**Your decisions carry forward.** If you crossed a line earlier, the wagon remembers. If you protected someone, they remember that too.

---

## Voice Input

Hold the microphone button to speak. Chrome/Edge only. Text input always works.

---

## Known Limitations

- Production build has a Windows/Git Bash path-casing bug — use `npm run dev`
- Mobile app (Expo) is separate; this guide covers web only
- AI responses require active internet + valid API key
- Some scenes have a 2-3 second AI generation delay (streaming shown live)
- No save/load between browser sessions (localStorage only)

---

## Debug Mode

Press **Ctrl+D** in dev mode to toggle a debug overlay showing:
- Current hidden state (resentment, protection, etc.)
- Run memory (what the wagon remembers)
- Recent decisions and their sentiment
- Active flags

Or add `?debug=1` to the URL.

---

## Feedback Prompts

Things worth noting as you play:
- Did the route you chose feel different from the others?
- Could you tell the wagon was reacting to earlier decisions?
- Was there a moment you felt like a captain rather than a menu-picker?
- What broke the immersion?
- What was surprisingly good?

---

## Known Rough Edges
- Minigames are intentionally lightweight (rhythm/timing/hunting)
- The Entertainment Circuit scene is new and may be rough
- Character voice consistency improves as the run goes on (AI has more context)
- Some transitions feel abrupt — noted, in progress
