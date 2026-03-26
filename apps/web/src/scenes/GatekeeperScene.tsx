'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction, EventOutcome, MemoryEvent } from '@whoreagon-trail/game-engine';
import { getLocationDisplayName } from '@whoreagon-trail/game-engine';
import { resolveEvent, streamDialogue } from '@whoreagon-trail/ai-client';
import { ROUTE_ARC_EARLY_DONE, ROUTE_ARC_MID_DONE } from '@/components/SceneBridge';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

export default function GatekeeperScene({ state, dispatch }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [negotiating, setNegotiating] = useState(false);

  useEffect(() => {
    if (!state || messages.length > 0) return;

    const routeType = state.route?.type ?? 'fort_route';
    const stigma = state.hiddenState?.stigmaPressure ?? 20;
    const flags = state.flags ?? [];

    const earlyDone = flags.includes(ROUTE_ARC_EARLY_DONE);
    const midDone = flags.includes(ROUTE_ARC_MID_DONE);

    // Arc phase signal for fort route
    const arcSignal = (() => {
      if (routeType !== 'fort_route') return '';
      if (midDone) return `The bureaucratic complication from mid-trail has preceded you. The gatekeeper may have heard something.`;
      if (earlyDone) return `The early fort road signals have put you on their radar. Expect scrutiny.`;
      return '';
    })();

    const protection = state.hiddenState?.protection ?? 0;
    const gatekeeperContext = [
      `__FORT_ENTRY__`,
      `Route: ${routeType.replace(/_/g, ' ')}.`,
      stigma > 60
        ? `Stigma pressure level: HIGH — rumors have preceded the troupe.`
        : stigma > 35
          ? `Stigma pressure level: MODERATE — word is traveling.`
          : `Stigma pressure level: LOW — relatively unknown here.`,
      `The gatekeeper should reflect this. High stigma means they know exactly what this wagon is and have already decided something about it.`,
      `Low stigma means they are suspicious but not certain. Give them specific body language and a specific concern.`,
      state.day > 5 && protection > 60
        ? `Word of this wagon's reputation for keeping people safe has reached here. The gatekeeper's skepticism is mixed with curiosity.`
        : null,
      state.runMemory?.events.some(e => e.type === 'gatekeeper_outcome' && e.sentiment === 'negative')
        ? `This wagon has been turned away before. The gatekeeper can sense the desperation of people who know they may not get another chance.`
        : state.runMemory?.events.some(e => e.type === 'gatekeeper_outcome' && e.sentiment === 'positive')
          ? `Word may have traveled. This wagon navigated gates before without incident — the gatekeeper is cautious rather than hostile.`
          : '',
      state.runMemory?.events.some(e => e.type === 'coaching_moment' && e.sentiment === 'positive')
        ? `The captain pulled someone aside before this. Whatever was said, the wagon arrived with unusual cohesion. The gatekeeper notices people who don't look desperate.`
        : '',
      arcSignal,
    ].filter(Boolean).join('\n\n');

    // Build delegation context from flags set by DelegationScene
    const speakerId   = state.flags.find(f => f.startsWith('SPEAKER:'))?.replace('SPEAKER:', '');
    const backupId    = state.flags.find(f => f.startsWith('BACKUP:'))?.replace('BACKUP:', '');
    const observerId  = state.flags.find(f => f.startsWith('OBSERVER:'))?.replace('OBSERVER:', '');
    const enforcerId  = state.flags.find(f => f.startsWith('ENFORCER:'))?.replace('ENFORCER:', '');
    const speakerName  = speakerId  ? state.party.find(p => p.id === speakerId)?.name  : null;
    const backupName   = backupId   ? state.party.find(p => p.id === backupId)?.name   : null;
    const observerName = observerId ? state.party.find(p => p.id === observerId)?.name : null;
    const enforcerName = enforcerId ? state.party.find(p => p.id === enforcerId)?.name : null;
    let delegationSignal = '';
    if (speakerName)  delegationSignal += `\nDELEGATION: ${speakerName} has been assigned as speaker for this encounter.`;
    if (backupName)   delegationSignal += ` ${backupName} is backup.`;
    if (observerName) delegationSignal += ` ${observerName} is observing.`;
    if (enforcerName) delegationSignal += ` ${enforcerName} is the exit option.`;
    if (delegationSignal) delegationSignal += ' Let the AI respond to who is speaking — their personality and relationship history should color the negotiation.';

    const fullGatekeeperContext = gatekeeperContext + delegationSignal;

    const streamingId = 'gate-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let acc = '';
    streamDialogue(state, fullGatekeeperContext, (chunk) => {
      acc += chunk;
      setMessages([{ id: streamingId, text: acc, isStreaming: true }]);
    }, 'FORT_GATEKEEPER').then((response) => {
      setMessages(response.dialogue.map((d, i) => ({
        id: `g-${i}`, characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      })));
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{ id: 'err', text: 'A man built like a grain warehouse blocks the gate. He has the look of someone who has said no to a lot of people and enjoyed every time. He looks at Delphine. Then at you. Then back at Delphine.', isStreaming: false }]);
      setInputEnabled(true);
    });
  }, [state]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state) return;
    const playerMsg: DisplayMessage = { id: `p-${Date.now()}`, text, isPlayer: true };
    const streamingId = `s-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);
    setInputEnabled(false);
    setNegotiating(true);
    const response = await resolveEvent(
      state,
      { type: 'fort_arrival', description: `Arriving at ${getLocationDisplayName(state.location)}` },
      text,
      'FORT_GATEKEEPER'
    );
    const newMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
      id: `r-${Date.now()}-${i}`,
      characterId: d.characterId,
      characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      voiceTag: d.tone,
      text: d.text,
    }));
    setMessages(prev => [...prev.filter(m => m.id !== streamingId), ...newMsgs]);
    const outcome: EventOutcome = {
      resourceChanges: response.eventOutcome.resourceChanges,
      healthChanges: response.eventOutcome.healthChanges,
      relationshipDeltas: response.relationshipDeltas,
      newFlags: response.newFlags,
    };
    dispatch({ type: 'APPLY_EVENT_OUTCOME', outcome });

    const result = response.eventOutcome.result;
    if (result === 'failure') {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { stigmaPressure: 10, resentment: 5 } });
    } else {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta: { stigmaPressure: -5, protection: 5 } });
      // Successful gatekeeper on fort_route advances to mid arc
      const currentFlags = state.flags ?? [];
      if (state.route?.type === 'fort_route' && !currentFlags.includes(ROUTE_ARC_MID_DONE)) {
        dispatch({ type: 'SET_FLAG', flag: ROUTE_ARC_MID_DONE });
      }
    }

    dispatch({
      type: 'RECORD_MEMORY_EVENT',
      event: {
        day: state.day,
        type: 'gatekeeper_outcome',
        label: result === 'success'
          ? `negotiated entry at ${getLocationDisplayName(state.location)}`
          : result === 'partial_success'
            ? `barely got through at ${getLocationDisplayName(state.location)}`
            : `turned away at ${getLocationDisplayName(state.location)}`,
        approach: result === 'success' ? 'charm' : result === 'failure' ? 'force' : 'compromise',
        sentiment: result === 'success' ? 'positive' : result === 'failure' ? 'negative' : 'ambiguous',
      } as MemoryEvent,
    });

    setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 2500);
    setInputEnabled(false);
  }, [state, dispatch]);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>
          {state ? getLocationDisplayName(state.location) : 'Fort'} — Gate
        </span>
        <span style={{ fontSize: '0.65rem', color: negotiating ? 'var(--gold)' : 'var(--muted)', letterSpacing: '0.1em' }}>
          {negotiating ? 'ENTRY GRANTED' : 'AT THE GATE'}
        </span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar onSubmit={handleSubmit} disabled={!inputEnabled} placeholder="Pick your words carefully." />
    </div>
  );
}
