'use client';
import React, { useState } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

// ── Supply catalog ─────────────────────────────────────────────────────────

const STARTING_BUDGET = 200; // dollars available to spend

type Item = {
  id: keyof Supplies;
  label: string;
  unit: string;
  pricePerUnit: number;
  increment: number;
  max: number;
  description: string;
};

const ITEMS: Item[] = [
  {
    id: 'food',
    label: 'Flour & Provisions',
    unit: 'lb',
    pricePerUnit: 0.50,
    increment: 50,
    max: 600,
    description: 'Essential for the road. 12 people eat ~24 lb/day at a steady pace.',
  },
  {
    id: 'water',
    label: 'Water Barrels',
    unit: 'barrel',
    pricePerUnit: 12,
    increment: 1,
    max: 10,
    description: 'Each barrel lasts a few days. Rivers dry up. Don\'t count on luck.',
  },
  {
    id: 'ammunition',
    label: 'Ammunition',
    unit: 'round',
    pricePerUnit: 0.20,
    increment: 20,
    max: 200,
    description: 'For hunting and protection. Runs out faster than you expect.',
  },
  {
    id: 'medicine',
    label: 'Medicine Kits',
    unit: 'kit',
    pricePerUnit: 20,
    increment: 1,
    max: 10,
    description: 'Cholera, infection, fever. The frontier doesn\'t warn you first.',
  },
];

type Supplies = { food: number; water: number; ammunition: number; medicine: number };

const DEFAULT_SUPPLIES: Supplies = { food: 100, water: 3, ammunition: 40, medicine: 2 };

function totalCost(s: Supplies): number {
  const food = s.food * 0.50;
  const water = s.water * 12;
  const ammunition = s.ammunition * 0.20;
  const medicine = s.medicine * 20;
  return food + water + ammunition + medicine;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SupplyShop({ state, dispatch }: Props) {
  const [supplies, setSupplies] = useState<Supplies>(DEFAULT_SUPPLIES);
  const [committed, setCommitted] = useState(false);

  if (!state) return null;

  const spent = totalCost(supplies);
  const remaining = STARTING_BUDGET - spent;
  const canAfford = remaining >= 0;

  const adjust = (id: keyof Supplies, delta: number) => {
    setSupplies(prev => {
      const item = ITEMS.find(i => i.id === id)!;
      const next = Math.max(0, Math.min(item.max, prev[id] + delta));
      const newSupplies = { ...prev, [id]: next };
      // Don't allow overspending
      if (totalCost(newSupplies) > STARTING_BUDGET) return prev;
      return newSupplies;
    });
  };

  const handleCommit = () => {
    if (!canAfford || committed) return;
    setCommitted(true);
    const cashLeft = Math.max(0, Math.round(remaining));
    // UPDATE_RESOURCES sets values directly (not deltas), so this replaces defaults.
    dispatch({
      type: 'UPDATE_RESOURCES',
      changes: {
        food: supplies.food,
        water: supplies.water,
        ammunition: supplies.ammunition,
        medicine: supplies.medicine,
        money: cashLeft,
      },
    });
    dispatch({ type: 'SET_PHASE', phase: 'TRAIL' });
  };

  const budgetColor = remaining < 0
    ? 'var(--error)'
    : remaining < 20
      ? '#e6a817'
      : 'var(--gold)';

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>Independence, Missouri — Whitman&apos;s General Store</span>
        <div className={styles.resources}>
          <span
            className={styles.resource}
            style={{ color: budgetColor }}
          >
            PURSE ${STARTING_BUDGET - Math.round(spent)} / ${STARTING_BUDGET}
          </span>
        </div>
      </div>

      <div className={styles.planningPanel}>
        <p className={styles.sceneTitle}>Outfit Your Wagon</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--cream)', fontStyle: 'italic', marginBottom: '8px' }}>
          Delphine left you $200 for provisions. She didn&apos;t say you had to spend all of it.
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '24px' }}>
          Whatever you don&apos;t spend stays as coin. You&apos;ll need both.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {ITEMS.map(item => {
            const qty = supplies[item.id];
            const itemCost = qty * item.pricePerUnit;
            const canAdd = totalCost({ ...supplies, [item.id]: qty + item.increment }) <= STARTING_BUDGET;

            return (
              <div
                key={item.id}
                style={{
                  borderLeft: '2px solid var(--gold-dim)',
                  paddingLeft: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '8px',
                  alignItems: 'start',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--cream)', marginBottom: '2px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gold-dim)', fontFamily: 'var(--font-mono)' }}>
                    ${item.pricePerUnit.toFixed(2)}/{item.unit}
                    {qty > 0 && (
                      <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>
                        → ${itemCost.toFixed(0)} for {qty} {item.unit}{qty !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
                  <button
                    onClick={() => adjust(item.id, -item.increment)}
                    disabled={qty === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: qty === 0 ? 'var(--border)' : 'var(--muted)',
                      cursor: qty === 0 ? 'default' : 'pointer',
                      fontSize: '1.1rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0 4px',
                    }}
                  >
                    −
                  </button>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    color: qty > 0 ? 'var(--cream)' : 'var(--muted)',
                    minWidth: '40px',
                    textAlign: 'center',
                  }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => adjust(item.id, item.increment)}
                    disabled={!canAdd || qty >= item.max}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: (!canAdd || qty >= item.max) ? 'var(--border)' : 'var(--muted)',
                      cursor: (!canAdd || qty >= item.max) ? 'default' : 'pointer',
                      fontSize: '1.1rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0 4px',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--cream)' }}>PROVISIONS: </span>
            {supplies.food}lb food · {supplies.water} water · {supplies.ammunition} ammo · {supplies.medicine} medicine
            <br />
            <span style={{ color: budgetColor }}>
              CASH REMAINING: ${Math.max(0, Math.round(remaining))}
            </span>
          </div>
          <button
            className={styles.advanceBtn}
            onClick={handleCommit}
            disabled={!canAfford || committed}
            style={{ opacity: committed ? 0.4 : 1 }}
          >
            {committed ? 'Loading wagon...' : 'Load the wagon →'}
          </button>
        </div>
      </div>
    </div>
  );
}
