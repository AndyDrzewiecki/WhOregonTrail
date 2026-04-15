'use client';
import React from 'react';
import type { GameState } from '@whoreagon-trail/game-engine';
import { getLocationDisplayName } from '@whoreagon-trail/game-engine';
import { selectSpotlightCharacter } from '@/lib/spotlightUtils';

// Arc phase flag constants
export const ROUTE_ARC_EARLY_DONE = 'ROUTE_ARC_EARLY_DONE';
export const ROUTE_ARC_MID_DONE = 'ROUTE_ARC_MID_DONE';
export const ROUTE_ARC_LATE_DONE = 'ROUTE_ARC_LATE_DONE';

interface Props {
  state: GameState | null;
  scene: string;
}

// Short bridge lines keyed to scene transitions
const BRIDGE_LINES: Record<string, string> = {
  SUPPLY_SHOP: 'What you bring determines what survives. Choose carefully.',
  TRAIL: 'The wagon rolls. Miles pass. The trail gives nothing back.',
  CONFLICT: 'Something has been building. Now it surfaces.',
  PLANNING: 'Time to decide what comes next.',
  GATEKEEPER: 'The fort walls ahead. First, the gate.',
  ENTERTAINMENT_CIRCUIT: 'A venue. An opportunity. Careful.',
  COACHING: 'One conversation before everything becomes public.',
  MINIGAME: 'The moment is practical. Skills matter here.',
  SUMMARY: 'Night. The fire. What the day cost.',
};

// Route + arc-phase aware atmospheric lines
function getRouteArcLine(state: GameState, scene: string): string {
  const routeType = state.route?.type ?? null;
  const flags = state.flags ?? [];

  const earlyDone = flags.includes(ROUTE_ARC_EARLY_DONE);
  const midDone = flags.includes(ROUTE_ARC_MID_DONE);
  const lateDone = flags.includes(ROUTE_ARC_LATE_DONE);

  if (routeType === 'fort_route') {
    if (lateDone) return 'Whatever happens at the gate, word has traveled. They know you\'re coming.';
    if (midDone) return 'Paperwork, credentials, questions. The wagon doesn\'t fit their ledger.';
    if (earlyDone) return 'The fort road is harder than they said. Eyes are already on you.';
    return 'Respectability is a tax this route collects daily.';
  }

  if (routeType === 'wilderness_route') {
    if (lateDone) return 'The wilderness doesn\'t break you with one blow. It just keeps going.';
    if (midDone) return 'Three days without a soul. People are starting to look at each other differently.';
    if (earlyDone) return 'The trail empties out. No settlements, no witnesses, no help.';
    return 'What happens on the trail, stays on the trail.';
  }

  if (routeType === 'entertainment_circuit') {
    if (lateDone) return 'They know your wagon now. That\'s worth something. Exactly what, is still being negotiated.';
    if (midDone) return 'The circuit has a way of turning performances into debts and debts into performances.';
    if (earlyDone) return 'First stop: money. Or the chance at it. Or the obligation of it.';
    return 'Every show is an audition for the next town.';
  }

  // No route set — fall back to static scene lines
  return BRIDGE_LINES[scene] ?? '';
}

export default function SceneBridge({ state, scene }: Props) {
  if (!state) return null;

  const locationName = getLocationDisplayName(state.location);
  const routeLabel = state.route?.type
    ? { fort_route: 'Fort Route', wilderness_route: 'Wilderness Route', entertainment_circuit: 'Entertainment Circuit' }[state.route.type]
    : null;

  const bridgeLine = state.route?.type
    ? getRouteArcLine(state, scene)
    : (BRIDGE_LINES[scene] ?? '');

  // Show spotlight character for CONFLICT and GATEKEEPER scenes
  const showSpotlight = scene === 'CONFLICT' || scene === 'GATEKEEPER';
  const spotlightId = showSpotlight ? selectSpotlightCharacter(state) : null;
  const spotlightMember = spotlightId ? state.party.find(p => p.id === spotlightId) : null;

  return (
    <div style={{
      padding: '8px clamp(16px,5vw,48px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          DAY {state.day}
        </span>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
          {locationName}
        </span>
        {routeLabel && (
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--gold)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
            {routeLabel.toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        {bridgeLine && (
          <span style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--muted)', textAlign: 'right', maxWidth: '300px' }}>
            {bridgeLine}
          </span>
        )}
        {spotlightMember && (
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.08em', color: 'var(--muted)', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
            Watching: {spotlightMember.name}
          </span>
        )}
      </div>
    </div>
  );
}
