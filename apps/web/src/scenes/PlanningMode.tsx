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
  const alive = party.filter(m => m.health > 0).length;

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
        </div>
      </div>

      <div className={styles.planningPanel}>
        <p className={styles.sceneTitle}>Set Pace</p>
        <div className={styles.paceOptions}>
          {(['rest', 'steady', 'grueling'] as Pace[]).map(p => (
            <button key={p} className={`${styles.paceBtn} ${pace === p ? styles.selected : ''}`} onClick={() => setPace(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
              {p === 'rest' && '  — 0 miles, low consumption'}
              {p === 'steady' && '  — 15 miles, normal consumption'}
              {p === 'grueling' && '  — 25 miles, high consumption'}
            </button>
          ))}
        </div>

        <button className={styles.advanceBtn} onClick={advance}>
          Move on &rarr;
        </button>
      </div>
    </div>
  );
}
