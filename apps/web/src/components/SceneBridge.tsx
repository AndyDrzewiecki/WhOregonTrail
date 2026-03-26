'use client';
import React from 'react';
import type { GameState } from '@whoreagon-trail/game-engine';
import { getLocationDisplayName } from '@whoreagon-trail/game-engine';

interface Props {
  state: GameState | null;
  scene: string;
}

// Short bridge lines keyed to scene transitions
const BRIDGE_LINES: Record<string, string> = {
  TRAIL: 'The wagon rolls. Miles pass. The trail gives nothing back.',
  CONFLICT: 'Something has been building. Now it surfaces.',
  PLANNING: 'Time to decide what comes next.',
  GATEKEEPER: 'The fort walls ahead. First, the gate.',
  ENTERTAINMENT_CIRCUIT: 'A venue. An opportunity. Careful.',
  COACHING: 'One conversation before everything becomes public.',
  MINIGAME: 'The moment is practical. Skills matter here.',
  SUMMARY: 'Night. The fire. What the day cost.',
};

export default function SceneBridge({ state, scene }: Props) {
  if (!state) return null;

  const locationName = getLocationDisplayName(state.location);
  const routeLabel = state.route?.type
    ? { fort_route: 'Fort Route', wilderness_route: 'Wilderness Route', entertainment_circuit: 'Entertainment Circuit' }[state.route.type]
    : null;
  const bridgeLine = BRIDGE_LINES[scene] ?? '';

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
      {bridgeLine && (
        <span style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--muted)', textAlign: 'right', maxWidth: '300px' }}>
          {bridgeLine}
        </span>
      )}
    </div>
  );
}
