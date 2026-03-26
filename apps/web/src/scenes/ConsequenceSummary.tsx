'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import { streamDialogue } from '@whoreagon-trail/ai-client';
import { buildSpotlightSignal, selectSpotlightCharacter } from '@/lib/spotlightUtils';
import { buildCharacterCallbackSignal } from '@/lib/characterCallbackUtils';
import { ROUTE_ARC_MID_DONE, ROUTE_ARC_LATE_DONE } from '@/components/SceneBridge';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

// ── Replay hook builder ───────────────────────────────────────────────────────

function buildReplayHook(state: GameState, dominantApproach: string | undefined): string {
  const routeType = state.route?.type;
  const resentment = state.hiddenState.resentment;
  const protection = state.hiddenState.protection;

  const routeAlternates: Record<string, string> = {
    fort_route: "Another captain would have taken the wilderness road and arrived without the paperwork. Whether they'd have arrived with the same people is another question.",
    wilderness_route: "Another captain would have taken the fort road and traded one kind of pressure for another. The gates are their own problem.",
    entertainment_circuit: "Another captain would have turned down the circuit entirely. The debt wouldn't exist. Neither would the reputation.",
  };

  const outcomeHook = resentment > 60
    ? "A wagon where people endure instead of stay is a different story. Worth finding out what the other version looks like."
    : protection > 65
    ? "You can protect everyone and still lose the run. Try it sometime."
    : "Same trail. Different choices. The wagon has more stories in it.";

  const routeHook = routeType ? routeAlternates[routeType] : '';

  return [routeHook, outcomeHook].filter(Boolean).join('\n\n');
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConsequenceSummary({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [exchanges, setExchanges] = useState(0);
  const MAX = 3;

  useEffect(() => {
    if (!state || messages.length > 0) return;
    dispatch({ type: 'SET_PHASE', phase: 'CAMPFIRE' });

    const hiddenSnap = state.hiddenState ?? null;
    const routeType = state.route?.type ?? null;

    const leadershipContext = [
      hiddenSnap?.resentment != null && hiddenSnap.resentment > 50
        ? 'There is real resentment toward the player\'s decisions tonight — someone will say something tonight that they normally would not.'
        : '',
      hiddenSnap?.protection != null && hiddenSnap.protection > 70
        ? 'People feel genuinely protected tonight — there is unusual warmth around this fire.'
        : '',
      hiddenSnap?.boundaryStrain != null && hiddenSnap.boundaryStrain > 50
        ? 'Boundary strain is high — someone will be quiet tonight in a way that says everything.'
        : '',
      hiddenSnap?.obedience != null && hiddenSnap.obedience < 30
        ? 'Obedience is breaking down — not everyone is going to agree with the captain\'s call tonight.'
        : '',
      routeType === 'entertainment_circuit'
        ? 'The entertainment circuit is taking a toll that not everyone signed up for. Someone will name it.'
        : routeType === 'wilderness_route'
          ? 'The wilderness route is isolating. Good and bad — no judgment from outsiders, but no buffer either.'
          : '',
    ].filter(Boolean).join(' ');

    const streamingId = 'camp-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    const recentSummary = state.eventHistory.slice(-3).map(e => e.description).join('; ');
    const routeNote = state.route?.type ? `Route: ${state.route.type}.` : '';
    const dayNote = (state.day ?? 1) >= 5 ? `Day ${state.day} on the trail — the novelty has worn off.` : '';
    const memoryContext = state.runMemory?.events.slice(-3).map(e => e.label).join('; ') ?? '';
    const memorySignal = memoryContext
      ? `The wagon remembers: ${memoryContext}. Characters should reference these specific events, not generic hardship.`
      : '';

    const arcPayoffSignal = (() => {
      const flags = state.flags ?? [];
      const lateDone = flags.includes(ROUTE_ARC_LATE_DONE);
      const midDone = flags.includes(ROUTE_ARC_MID_DONE);

      if (lateDone) {
        if (routeType === 'fort_route') {
          return `The fort arc has completed. What happened at the gates defined this run's relationship to authority and respectability.`;
        }
        if (routeType === 'wilderness_route') {
          return `The wilderness arc has played out. What the isolation revealed about these people is now permanent.`;
        }
        if (routeType === 'entertainment_circuit') {
          return `The circuit arc has run its course. The debt, the performance, the exploitation risk — it's settled now, one way or another.`;
        }
      }
      if (midDone && routeType) {
        const routeHumanName = routeType === 'fort_route'
          ? 'fort'
          : routeType === 'wilderness_route'
            ? 'wilderness'
            : 'circuit';
        return `The ${routeHumanName} arc is mid-resolution. The campfire tonight feels like a reckoning that's only half-over.`;
      }
      return '';
    })();

    const boundaryCallbackSignal = (() => {
      if (!state?.runMemory) return '';
      if (state.runMemory.boundaryCrossed && state.runMemory.boundaryDefended) {
        return `This run has had both — a boundary crossed and a line held. Someone around this fire knows the difference. Let them name it without explaining it.`;
      }
      if (state.runMemory.boundaryCrossed) {
        return `A boundary was crossed earlier. Nobody has named it directly yet. Campfire is where that surfaces — obliquely, in a comment that isn't quite a comment.`;
      }
      if (state.runMemory.boundaryDefended) {
        return `The captain held a line that didn't have to be held. Someone around this fire is grateful in a way they won't say directly.`;
      }
      return '';
    })();

    const campfireSpotlightId = selectSpotlightCharacter(state);
    const campfireCharCallback = campfireSpotlightId
      ? buildCharacterCallbackSignal(state, campfireSpotlightId, 'campfire')
      : '';

    const campfireSignal = [
      `__CAMPFIRE_START__: Reflect on today. Recent events: ${recentSummary}. Characters should react to SPECIFIC things that happened, not generic trail hardship. If someone died today, someone is grieving. If a conflict went unresolved, someone is still angry. Campfire is where the real feelings come out.`,
      routeNote,
      arcPayoffSignal,
      dayNote,
      leadershipContext,
      memorySignal,
      boundaryCallbackSignal,
      buildSpotlightSignal(state),
      campfireCharCallback,
    ].filter(Boolean).join('\n\n');

    streamDialogue(state, campfireSignal, (chunk) => {
      acc += chunk;
      setMessages([{ id: streamingId, text: acc, isStreaming: true }]);
    }, 'CAMPFIRE').then((response) => {
      setMessages(response.dialogue.map((d, i) => ({
        id: `camp-${i}`, characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      })));
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: 'The fire burns low. Delphine is cleaning her boots. Someone is crying quietly at the edge of the firelight. Nobody asks who.', isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state, dispatch]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state || exchanges >= MAX) return;
    const playerMsg: DisplayMessage = { id: `p-${Date.now()}`, text, isPlayer: true };
    const streamingId = `s-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);
    setInputEnabled(false);
    let acc = '';
    await streamDialogue(state, text, (chunk) => {
      acc += chunk;
      setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, text: acc } : m));
    }).then((response) => {
      const newMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `r-${Date.now()}-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      }));
      setMessages(prev => [...prev.filter(m => m.id !== streamingId), ...newMsgs]);
      const next = exchanges + 1;
      setExchanges(next);
      if (next >= MAX) {
        setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 1500);
      } else {
        setInputEnabled(true);
      }
    });
  }, [state, dispatch, exchanges]);

  // ── Reflection-section data (computed outside JSX for clarity) ──────────────

  const hiddenSnap = state?.hiddenState ?? null;

  const r = hiddenSnap?.resentment ?? 20;
  const p = hiddenSnap?.protection ?? 50;
  const b = hiddenSnap?.boundaryStrain ?? 0;
  const s = hiddenSnap?.stigmaPressure ?? 20;
  const o = hiddenSnap?.obedience ?? 60;
  const d = hiddenSnap?.indebtedness ?? 0;
  const route = state?.route?.type ?? null;

  const protectedIds = state?.runMemory?.protectedCharacterIds ?? [];
  const usedIds = state?.runMemory?.usedCharacterIds ?? [];
  const boundaryDefended = state?.runMemory?.boundaryDefended ?? false;

  // Resolve names from party (works for both alive and dead members in memory)
  const protectedNames = protectedIds
    .map(id => state?.party.find(pm => pm.id === id)?.name)
    .filter((n): n is string => Boolean(n));
  const usedNames = usedIds
    .map(id => state?.party.find(pm => pm.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  // ── Primary leadership reflection (priority order) ────────────────────────

  const leadershipReflection = (() => {
    // 1. Mixed record: protected some, used others
    if (protectedIds.length >= 2 && usedIds.length >= 1) {
      return "You kept some close and spent others. The ones you protected know it. The ones you used know it too. You'll arrive in Oregon with both kinds of debt.";
    }

    // 2. High resentment — name a used character if available
    if (r > 65) {
      const culprit = usedNames[0];
      if (culprit) {
        return `The wagon is fracturing. ${culprit} made sure their grievance was visible at every camp.`;
      }
      return route === 'entertainment_circuit'
        ? 'The circuit pays. The cost is not in money. A few more nights like this and you will not recognize who is still standing next to you.'
        : 'The wagon is still moving. Not everyone inside it believes in where it is going anymore. That is a different thing than a broken axle but it breaks just the same.';
    }

    // 3. High protection + boundary defended
    if (p > 70 && boundaryDefended) {
      return "You held the line and kept people behind it. That's not nothing. Oregon will remember a captain who didn't let the road eat them.";
    }

    // 4. High protection without boundary defense
    if (p > 70 && b < 30) {
      return route === 'wilderness_route'
        ? 'Out here, no judges. No gatekeepers. Just your people and what you have built. Tonight, it feels like something real. Tomorrow that will be tested again.'
        : 'There is warmth around this fire that did not have to be here. You earned it by making choices that cost you something. That is not nothing.';
    }

    // 5. High boundary strain — add route-specific suffix
    if (b > 55) {
      const base = d > 40
        ? 'The debt is real. The strain is real. Some in this wagon know the difference between a captain who leads and one who borrows against people who cannot say no. The question is whether you do.'
        : 'You have been pushing. Someone has been bending to make it work. Bending is not the same as breaking, but it is the direction.';
      const routeSuffix = route === 'fort_route'
        ? ' The fort road charges extra for that kind of arrangement.'
        : route === 'entertainment_circuit'
        ? ' The circuit made sure you understood the pricing.'
        : route === 'wilderness_route'
        ? ' The wilderness just watched.'
        : '';
      return base + routeSuffix;
    }

    // 6. Low obedience
    if (o < 35) {
      return 'Not everyone is following anymore. Not overtly — but you can see it in the small things. What that becomes next depends entirely on what you do tomorrow.';
    }

    // 7. High stigma
    if (s > 60) {
      return route === 'fort_route'
        ? 'They know who you are before you arrive. That is going to keep being true. The only question is whether you use it or fight it.'
        : 'Stigma is high. On the wilderness route, that mostly means whispers between your own people. That is its own problem.';
    }

    // 8. Default
    return 'Day done. Nobody died. The fire goes out. That is the full story of a good day on this trail, and that is enough.';
  })();

  // ── Character callout ──────────────────────────────────────────────────────

  let characterCallout = '';
  if (protectedNames.length > 0 && usedNames.length > 0) {
    characterCallout = `${protectedNames.slice(0, 2).join(' and ')} stayed because they wanted to. ${usedNames[0]} stayed because leaving wasn't an option.`;
  } else if (protectedNames.length > 0) {
    characterCallout = `${protectedNames.slice(0, 2).join(' and ')} made it because someone was paying attention.`;
  } else if (usedNames.length > 0) {
    characterCallout = `${usedNames.slice(0, 2).join(' and ')} are still counting what this cost them.`;
  }

  // ── Leadership approach summary ────────────────────────────────────────────

  const approachCounts = (state?.runMemory?.events ?? []).reduce((acc, e) => {
    if (e.approach) acc[e.approach] = (acc[e.approach] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantApproach = Object.entries(approachCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const approachSummary: Record<string, string> = {
    charm: 'You talked your way through most of it. They never knew when to believe you, which meant they always had to.',
    force: "You pushed when pushing was the only language available. It worked until it didn't, and then you pushed again.",
    compromise: 'You split every difference. Nobody got everything. Nobody left with nothing. That takes more out of a person than it looks.',
    manipulation: "You moved people into positions they didn't choose. Some of them know it. All of them felt it.",
    sacrifice: 'You kept asking people to pay costs you named on their behalf. The trail accepted every payment.',
  };

  const leadershipApproach = dominantApproach ? (approachSummary[dominantApproach] ?? '') : '';

  // ── Replay hook ────────────────────────────────────────────────────────────

  const replayHook = state ? buildReplayHook(state, dominantApproach) : '';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>Campfire — Night Camp</span>
      </div>
      <DialogueStream messages={messages} />
      {exchanges < MAX && (
        <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="The fire's going. Say what needs saying." />
      )}
      {exchanges >= MAX && (
        <div style={{ padding: '16px clamp(16px,5vw,48px)', textAlign: 'center' }}>

          {/* ── Divider ── */}
          <div style={{ borderTop: '1px solid var(--gold-dim)', margin: '0 0 16px' }} />

          {/* ── Primary leadership reflection ── */}
          <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>
            {leadershipReflection}
          </p>

          {/* ── Character callout (muted secondary line) ── */}
          {characterCallout && (
            <p style={{
              fontStyle: 'italic',
              fontSize: '0.8rem',
              color: 'var(--muted)',
              opacity: 0.7,
              marginBottom: '8px',
            }}>
              {characterCallout}
            </p>
          )}

          {/* ── Leadership approach summary ── */}
          {leadershipApproach && (
            <p style={{
              fontStyle: 'italic',
              fontSize: '0.8rem',
              color: 'var(--muted)',
              opacity: 0.7,
              marginBottom: '16px',
            }}>
              {leadershipApproach}
            </p>
          )}

          {/* ── Divider ── */}
          <div style={{ borderTop: '1px solid var(--gold-dim)', margin: '0 0 16px' }} />

          {/* ── Replay hook box ── */}
          {replayHook && (
            <div style={{
              border: '1px solid var(--gold-dim)',
              padding: '14px 18px',
              marginBottom: '20px',
              textAlign: 'left',
            }}>
              {replayHook.split('\n\n').map((line, i) => (
                <p key={i} style={{
                  fontStyle: 'italic',
                  fontSize: '0.78rem',
                  color: 'var(--muted)',
                  opacity: 0.65,
                  margin: i > 0 ? '10px 0 0' : '0',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {line}
                </p>
              ))}
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className={styles.advanceBtn}
              onClick={() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' })}
            >
              Day {state?.day ?? 1} complete. Break camp &rarr;
            </button>
            <button
              className={styles.advanceBtn}
              style={{ color: 'var(--muted)', borderBottomColor: 'var(--gold-dim)' }}
              onClick={() => {
                if (state) dispatch({ type: 'START_RUN', party: state.party });
              }}
            >
              Run it again &rarr;
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
