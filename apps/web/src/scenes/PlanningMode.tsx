'use client';
import React, { useState } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import { getLocationDisplayName } from '@whoreagon-trail/game-engine';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }
type Pace = 'rest' | 'steady' | 'grueling';

export default function PlanningMode({ state, dispatch }: Props) {
  const [pace, setPace] = useState<Pace>('steady');

  if (!state) return null;

  const { resources, party, day, location } = state;
  const alive = party.filter(m => m.isAlive).length;
  const aliveMember = party.filter(m => m.isAlive);

  // Atmospheric situation text
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
  const situationText = `${oxenLine} ${foodLine}`;

  // Pace descriptions
  const restNeedsRest = (resources.oxenHealth ?? 100) < 60 || aliveMember.some(m => m.health < 50);
  const paceDescriptions: Record<Pace, string> = {
    rest: `Rest the oxen and the troupe. No miles today. Your people need it.${restNeedsRest ? ' — Recommended' : ''}`,
    steady: 'Fifteen miles at a measured pace. The safe choice.',
    grueling: 'Twenty-five miles. You\'ll pay for this later.',
  };

  // Move button label
  const advanceBtnLabel = day === 0
    ? 'Begin the journey \u2192'
    : pace === 'rest'
      ? 'Make camp \u2192'
      : 'Move on \u2192';

  // Party status line
  let partyStatus = `Party: All ${alive} are trail-ready.`;
  const criticalMember = aliveMember.find(m => m.health < 25);
  const injuredCount = aliveMember.filter(m => m.health < 50).length;
  const wellCount = aliveMember.filter(m => m.health >= 50).length;
  if (criticalMember) {
    const name = criticalMember.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    partyStatus = `Party: ${name} won't last another grueling day.`;
  } else if (injuredCount > 0) {
    partyStatus = `Party: ${wellCount} moving well. ${injuredCount} need rest.`;
  }

  const advance = () => {
    dispatch({ type: 'ADVANCE_DAY', pace });
  };

  const resourceClass = (val: number, warn: number, crit: number) =>
    val <= crit ? styles.critical : val <= warn ? styles.warning : '';

  return (
    <div className={styles.scene}>
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
          <span className={styles.resource}>{alive}/{party.length} ALIVE</span>
          <span className={styles.resource} style={{ opacity: 0.7, fontSize: '0.7rem' }}>{partyStatus}</span>
        </div>
      </div>

      <div className={styles.planningPanel}>
        <p className={styles.sceneTitle} style={{ fontStyle: 'italic', fontSize: '0.9rem', opacity: 0.75, marginBottom: '16px' }}>
          {situationText} How hard do you push?
        </p>
        <div className={styles.paceOptions}>
          {(['rest', 'steady', 'grueling'] as Pace[]).map(p => (
            <button key={p} className={`${styles.paceBtn} ${pace === p ? styles.selected : ''}`} onClick={() => setPace(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)} — {paceDescriptions[p]}
            </button>
          ))}
        </div>

        <button className={styles.advanceBtn} onClick={advance}>
          {advanceBtnLabel}
        </button>
      </div>
    </div>
  );
}
