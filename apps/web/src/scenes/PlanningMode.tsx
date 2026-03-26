'use client';
import React, { useState } from 'react';
import type { GameState, GameAction, RouteProfile, MemoryEvent } from '@whoreagon-trail/game-engine';
import { getLocationDisplayName } from '@whoreagon-trail/game-engine';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }
type Pace = 'rest' | 'steady' | 'grueling';
type Stage = 'pace' | 'route' | 'role' | 'advancing';

const ROUTE_PROFILES: Record<string, RouteProfile> = {
  fort_route: {
    type: 'fort_route',
    chosenOnDay: 0,
    gatekeeperIntensity: 'high',
    exposureLevel: 'low',
    socialCost: 'low',
  },
  wilderness_route: {
    type: 'wilderness_route',
    chosenOnDay: 0,
    gatekeeperIntensity: 'low',
    exposureLevel: 'high',
    socialCost: 'low',
  },
  entertainment_circuit: {
    type: 'entertainment_circuit',
    chosenOnDay: 0,
    gatekeeperIntensity: 'high',
    exposureLevel: 'high',
    socialCost: 'high',
  },
};

type HiddenDelta = Partial<{
  protection: number;
  stigmaPressure: number;
  indebtedness: number;
  resentment: number;
  obedience: number;
  boundaryStrain: number;
}>;

const ROUTE_DELTAS: Record<string, HiddenDelta> = {
  fort_route: { stigmaPressure: 15, protection: 5 },
  wilderness_route: { stigmaPressure: -10, boundaryStrain: 10 },
  entertainment_circuit: { stigmaPressure: 10, boundaryStrain: 15, indebtedness: 5 },
};

export default function PlanningMode({ state, dispatch }: Props) {
  const [pace, setPace] = useState<Pace>('steady');
  const [stage, setStage] = useState<Stage>('pace');
  const [roleText, setRoleText] = useState('');

  if (!state) return null;

  const { resources, party, day, location } = state;
  const alive = party.filter(m => m.isAlive);
  const currentRoute = state.route;
  const needsRouteChoice = currentRoute === null || day % 3 === 0;

  // Atmospheric text
  const foodLine = resources.food < 30
    ? 'You\'re almost out of food.'
    : resources.food < 60
      ? 'The flour barrel is getting light.'
      : 'Supplies are holding.';
  const oxenLine = resources.oxenHealth < 50
    ? 'Your oxen are struggling.'
    : resources.oxenHealth >= 70
      ? 'The oxen are in good shape.'
      : 'The oxen are pushing through.';

  // Pace descriptions
  const restNeedsRest = resources.oxenHealth < 60 || alive.some(m => m.health < 50);
  const paceDescriptions: Record<Pace, string> = {
    rest: `Rest the oxen and the troupe. No miles today.${restNeedsRest ? ' — Recommended' : ''}`,
    steady: 'Fifteen miles at a measured pace. The safe choice.',
    grueling: 'Twenty-five miles. You\'ll pay for this later.',
  };

  // Party status
  const critical = alive.find(m => m.health < 25);
  const injured = alive.filter(m => m.health < 50).length;
  const partyStatus = critical
    ? `${critical.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} won't last another grueling day.`
    : injured > 0
      ? `${alive.length - injured} moving well. ${injured} need rest.`
      : `All ${alive.length} are trail-ready.`;

  const resourceClass = (val: number, warn: number, crit: number) =>
    val <= crit ? styles.critical : val <= warn ? styles.warning : '';

  // HANDLERS
  const handlePaceCommit = () => {
    setStage(needsRouteChoice ? 'route' : 'role');
  };

  const handleRouteChoice = (routeKey: string) => {
    const profile: RouteProfile = { ...ROUTE_PROFILES[routeKey], chosenOnDay: day };
    dispatch({ type: 'SET_ROUTE', route: profile });
    const delta = ROUTE_DELTAS[routeKey];
    if (delta) {
      dispatch({ type: 'APPLY_HIDDEN_DELTA', delta });
    }
    const routeType = routeKey as 'fort_route' | 'wilderness_route' | 'entertainment_circuit';
    dispatch({
      type: 'RECORD_MEMORY_EVENT',
      event: {
        day: state?.day ?? 1,
        type: 'route_chosen',
        label: routeType === 'fort_route'
          ? 'chose fort route — public visibility, gatekeepers, respectable front'
          : routeType === 'wilderness_route'
            ? 'chose wilderness route — isolation, internal pressure, no outside judgment'
            : 'chose entertainment circuit — performance demands, boundary economics, debt pressure',
        sentiment: 'ambiguous',
      } as MemoryEvent,
    });
    setStage('role');
  };

  const handleRoleSubmit = (text: string) => {
    if (text.trim()) {
      dispatch({ type: 'SET_FLAG', flag: `ROLE_ASSIGNMENT:${text.trim()}` });
    }
    setStage('advancing');
    dispatch({ type: 'ADVANCE_DAY', pace });
  };

  const header = (
    <div className={styles.header}>
      <span className={styles.location}>{getLocationDisplayName(location)} — Day {day}</span>
      <div className={styles.resources}>
        <span className={`${styles.resource} ${resourceClass(resources.food, 100, 40)}`}>
          FOOD {resources.food}lb
        </span>
        <span className={`${styles.resource} ${resourceClass(resources.water, 4, 2)}`}>
          WATER {resources.water}
        </span>
        <span className={styles.resource}>COIN ${resources.money}</span>
        <span className={styles.resource}>{alive.length}/{party.length} ALIVE</span>
      </div>
    </div>
  );

  // PACE STAGE
  if (stage === 'pace') {
    return (
      <div className={styles.scene}>
        {header}
        <div className={styles.planningPanel}>
          <p style={{ fontStyle: 'italic', fontSize: '0.9rem', opacity: 0.75, marginBottom: '4px', color: 'var(--cream)' }}>
            {oxenLine} {foodLine}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '16px' }}>
            Party: {partyStatus}
          </p>
          <p className={styles.sceneTitle}>Set Pace</p>
          <div className={styles.paceOptions}>
            {(['rest', 'steady', 'grueling'] as Pace[]).map(p => (
              <button
                key={p}
                className={`${styles.paceBtn} ${pace === p ? styles.selected : ''}`}
                onClick={() => setPace(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)} — {paceDescriptions[p]}
              </button>
            ))}
          </div>
          <button className={styles.advanceBtn} onClick={handlePaceCommit}>
            {day === 0 ? 'Begin the journey →' : pace === 'rest' ? 'Make camp →' : 'Set pace →'}
          </button>
        </div>
      </div>
    );
  }

  // ROUTE STAGE
  if (stage === 'route') {
    return (
      <div className={styles.scene}>
        {header}
        <div className={styles.planningPanel}>
          <p className={styles.sceneTitle}>Which Route?</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '16px' }}>
            Route shapes who you meet, what they want, and what it costs.
          </p>
          <div className={styles.paceOptions}>
            <button className={styles.paceBtn} onClick={() => handleRouteChoice('fort_route')}>
              <strong>Fort Route</strong> — Stay on the main trail.<br />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                More gatekeepers. More supplies. More judgment.
              </span><br />
              <span style={{ fontSize: '0.7rem', color: 'var(--gold-dim)' }}>
                + 20 stigma pressure &nbsp;·&nbsp; safer supplies
              </span>
            </button>
            <button className={styles.paceBtn} onClick={() => handleRouteChoice('wilderness_route')}>
              <strong>Wilderness Route</strong> — Cut through rougher country.<br />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Less oversight. More exposure. Less judgment.
              </span><br />
              <span style={{ fontSize: '0.7rem', color: 'var(--gold-dim)' }}>
                + 20 exposure &nbsp;·&nbsp; fewer supplies &nbsp;·&nbsp; less judgment
              </span>
            </button>
            {resources.money > 40 && (
              <button className={styles.paceBtn} onClick={() => handleRouteChoice('entertainment_circuit')}>
                <strong>Entertainment Circuit</strong> — Play every stop.<br />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Earn more. Cost more. Everyone notices.
                </span><br />
                <span style={{ fontSize: '0.7rem', color: 'var(--gold-dim)' }}>
                  + high social cost &nbsp;·&nbsp; + income &nbsp;·&nbsp; + boundary strain
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ROLE STAGE
  if (stage === 'role') {
    return (
      <div className={styles.scene}>
        {header}
        <div className={styles.planningPanel}>
          <p className={styles.sceneTitle}>Before You Move Out</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--cream)', marginBottom: '16px', fontStyle: 'italic' }}>
            Who leads if something happens on the trail today?
          </p>
          <textarea
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--gold-dim)',
              color: 'var(--cream)',
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              width: '100%',
              resize: 'none',
              padding: '6px 0',
              lineHeight: '1.6',
              minHeight: '60px',
              outline: 'none',
            }}
            placeholder="Name a character, or describe your plan..."
            value={roleText}
            onChange={e => setRoleText(e.target.value)}
            onFocus={e => { (e.target.style as CSSStyleDeclaration).borderBottomColor = 'var(--gold)'; }}
            onBlur={e => { (e.target.style as CSSStyleDeclaration).borderBottomColor = 'var(--gold-dim)'; }}
          />
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <button className={styles.advanceBtn} onClick={() => handleRoleSubmit(roleText)}>
              Move on →
            </button>
            <button
              onClick={() => handleRoleSubmit('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-serif)',
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ADVANCING (brief wait state)
  return (
    <div className={styles.scene}>
      {header}
      <div className={styles.planningPanel}>
        <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
          The wagon moves.
        </p>
      </div>
    </div>
  );
}
