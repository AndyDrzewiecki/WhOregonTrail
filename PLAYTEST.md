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

**A full run takes ~20-30 minutes.** The loop each day:

1. **Prologue** — Scene-setting cold open
2. **Character Introductions** — Meet who you're leading. Address them.
3. **Planning** — Choose pace, route (Fort/Wilderness/Entertainment Circuit), and who leads if something goes wrong on the trail
4. **Trail** — Events, conflicts, minigames
5. **Coaching** *(conditional)* — Before reaching a fort or venue, pull one character aside privately if resentment or strain is high
6. **Delegation** *(conditional)* — Assign roles (Speaker, Backup, Observer, Enforcer) before the encounter. Fires once per day if you have 2+ non-player alive party members.
7. **Gatekeeper or Entertainment Circuit** — Negotiate entry or performance terms
8. **Campfire** — End-of-day processing. Up to 3 exchanges. Characters react to what happened specifically.
9. Repeat from Planning until Oregon.

**Route choice matters.** Each route has different external pressures and internal consequences. You'll feel them.

**Your decisions carry forward.** If you crossed a line earlier, the wagon remembers. If you protected someone, they remember that too.

**After the campfire, you can:**
- **Break camp** — continue to the next day's Planning
- **Run it again** — start a fresh run with the same party

---

## Voice Input

Hold the microphone button to speak. Chrome/Edge only. Text input always works everywhere.

---

## Known Limitations

- Production build has a Windows/Git Bash path-casing bug — use `npm run dev`
- Mobile app (Expo) is separate; this guide covers web only
- AI responses require active internet + valid API key
- Some scenes have a 2-3 second AI generation delay (streaming shown live)
- State persists across page refreshes (localStorage); closing and reopening resumes your run
- Entertainment Circuit route requires money > $40 to appear as a route option — it won't appear on Day 1 with default resources

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
- Did the Delegation screen (role assignment before an encounter) feel meaningful or like overhead?
- Was there a moment you felt like a captain rather than a menu-picker?
- What broke the immersion?
- What was surprisingly good?

---

## Known Rough Edges
- Minigames are intentionally lightweight (rhythm/timing/hunting)
- Entertainment Circuit requires money to unlock — testers may not see it until mid-run
- Coaching and Delegation are conditional — they won't appear every day
- Character voice consistency improves as the run goes on (AI has more context)
- ConsequenceSummary (Campfire) shows the "Run it again" button only after all 3 exchanges complete
- Campfire auto-advances to the next day after 3 exchanges if you use the command bar; or manually via "Break camp"
