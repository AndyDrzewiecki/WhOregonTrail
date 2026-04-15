'use client';
import React, { useState } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import { getLocationDisplayName } from '@whoreagon-trail/game-engine';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

// ── Fort supply catalog ────────────────────────────────────────────────────
// Prices are 30-50% above the initial Independence shop — you're off the main
// supply routes and the fort knows it.

type SupplyId = 'food' | 'water' | 'ammunition' | 'medicine';

type Item = {
  id: SupplyId;
  label: string;
  unit: string;
  pricePerUnit: number;
  increment: number;
  max: number;
  description: string;
};

const FORT_ITEMS: Item[] = [
  {
    id: 'food',
    label: 'Flour & Jerked Meat',
    unit: 'lb',
    pricePerUnit: 0.70,
    increment: 25,
    max: 300,
    description: 'Fort prices. You\'re paying for the road, not the goods.',
  },
  {
    id: 'water',
    label: 'Water Barrels',
    unit: 'barrel',
    pricePerUnit: 15,
    increment: 1,
    max: 6,
    description: 'Fresh water, questionable source. Better than the creek.',
  },
  {
    id: 'ammunition',
    label: 'Ammunition',
    unit: 'round',
    pricePerUnit: 0.30,
    increment: 20,
    max: 100,
    description: 'Running low is not a plan.',
  },
  {
    id: 'medicine',
    label: 'Medicine Kits',
    unit: 'kit',
    pricePerUnit: 25,
    increment: 1,
    max: 5,
    description: 'The fort surgeon charges extra for the clean hands.',
  },
];

type Cart = Record<SupplyId, number>;

const EMPTY_CART: Cart = { food: 0, water: 0, ammunition: 0, medicine: 0 };

function cartCost(cart: Cart): number {
  return FORT_ITEMS.reduce((sum, item) => sum + cart[item.id] * item.pricePerUnit, 0);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function FortSupplyScene({ state, dispatch }: Props) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [committed, setCommitted] = useState(false);

  if (!state) return null;

  const { resources, location } = state;
  const budget = resources.money;
  const spent = cartCost(cart);
  const remaining = budget - spent;
  const canAfford = remaining >= 0;

  const adjust = (id: SupplyId, delta: number) => {
    setCart(prev => {
      const item = FORT_ITEMS.find(i => i.id === id)!;
      const next = Math.max(0, Math.min(item.max, prev[id] + delta));
      const newCart = { ...prev, [id]: next };
      if (cartCost(newCart) > budget) return prev;
      return newCart;
    });
  };

  const handleCommit = () => {
    if (!canAfford || committed) return;
    setCommitted(true);

    // APPLY_EVENT_OUTCOME adds deltas; UPDATE_RESOURCES sets directly.
    // We want to add to existing stock, so use UPDATE_RESOURCES with current + delta.
    if (spent > 0) {
      dispatch({
        type: 'UPDATE_RESOURCES',
        changes: {
          food: resources.food + cart.food,
          water: resources.water + cart.water,
          ammunition: resources.ammunition + cart.ammunition,
          medicine: resources.medicine + cart.medicine,
          money: Math.max(0, Math.round(remaining)),
        },
      });
    }

    // Clear the fort shop flag and advance to campfire
    dispatch({ type: 'REMOVE_FLAG', flag: 'FORT_SHOP_READY' });
    dispatch({ type: 'SET_PHASE', phase: 'CAMPFIRE' });
  };

  const budgetColor = remaining < 0
    ? 'var(--error)'
    : remaining < 10
      ? '#e6a817'
      : 'var(--gold)';

  const locationName = getLocationDisplayName(location);

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>{locationName} — Supply Post</span>
        <div className={styles.resources}>
          <span className={styles.resource}>
            FOOD {resources.food}lb
          </span>
          <span className={styles.resource}>
            WATER {resources.water}
          </span>
          <span className={styles.resource} style={{ color: budgetColor }}>
            COIN ${Math.max(0, Math.round(remaining))} / ${budget}
          </span>
        </div>
      </div>

      <div className={styles.planningPanel}>
        <p className={styles.sceneTitle}>{locationName} — Resupply</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--cream)', fontStyle: 'italic', marginBottom: '4px' }}>
          You&apos;re inside. The fort quartermaster has what you need at fort prices.
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '24px' }}>
          {budget === 0
            ? 'You have nothing to spend. Take what you need from what you carry.'
            : `$${budget} left. Spend it here or keep it for later.`}
        </p>

        {budget === 0 ? (
          <div style={{ borderLeft: '2px solid var(--gold-dim)', paddingLeft: '16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
              The quartermaster looks you over. You look the quartermaster over.
              Nobody pretends you have anything to offer.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FORT_ITEMS.map(item => {
              const qty = cart[item.id];
              const itemCost = qty * item.pricePerUnit;
              const canAdd = cartCost({ ...cart, [item.id]: qty + item.increment }) <= budget;

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
                        background: 'none', border: 'none',
                        color: qty === 0 ? 'var(--border)' : 'var(--muted)',
                        cursor: qty === 0 ? 'default' : 'pointer',
                        fontSize: '1.1rem', fontFamily: 'var(--font-mono)', padding: '0 4px',
                      }}
                    >
                      −
                    </button>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
                      color: qty > 0 ? 'var(--cream)' : 'var(--muted)',
                      minWidth: '32px', textAlign: 'center',
                    }}>
                      {qty}
                    </span>
                    <button
                      onClick={() => adjust(item.id, item.increment)}
                      disabled={!canAdd || qty >= item.max}
                      style={{
                        background: 'none', border: 'none',
                        color: (!canAdd || qty >= item.max) ? 'var(--border)' : 'var(--muted)',
                        cursor: (!canAdd || qty >= item.max) ? 'default' : 'pointer',
                        fontSize: '1.1rem', fontFamily: 'var(--font-mono)', padding: '0 4px',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{
          marginTop: '32px', paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {spent > 0 ? (
              <>
                <span style={{ color: 'var(--cream)' }}>ADDING: </span>
                {cart.food > 0 && `+${cart.food}lb food `}
                {cart.water > 0 && `+${cart.water} water `}
                {cart.ammunition > 0 && `+${cart.ammunition} ammo `}
                {cart.medicine > 0 && `+${cart.medicine} medicine`}
                <br />
              </>
            ) : null}
            <span style={{ color: budgetColor }}>
              REMAINING: ${Math.max(0, Math.round(remaining))}
            </span>
          </div>
          <button
            className={styles.advanceBtn}
            onClick={handleCommit}
            disabled={committed}
            style={{ opacity: committed ? 0.4 : 1 }}
          >
            {committed
              ? 'Loading up...'
              : spent > 0
                ? `Buy & move on →`
                : 'Move on →'}
          </button>
        </div>
      </div>
    </div>
  );
}
