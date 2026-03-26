'use client';
import React, { useState } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import styles from './Scene.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

type RoleKey = 'SPEAKER' | 'BACKUP' | 'OBSERVER' | 'ENFORCER';

const ROLE_LABELS: Record<RoleKey, { label: string; desc: string }> = {
  SPEAKER:  { label: 'Speaker',  desc: 'leads the talking' },
  BACKUP:   { label: 'Backup',   desc: 'steps in if things go wrong' },
  OBSERVER: { label: 'Observer', desc: 'watches, stays quiet, reports back' },
  ENFORCER: { label: 'Enforcer', desc: 'reminds them we could leave' },
};

export default function DelegationScene({ state, dispatch }: Props) {
  const [assignments, setAssignments] = useState<Partial<Record<RoleKey, string>>>({});

  if (!state) return null;

  const playerId = state.party[0]?.id;
  const aliveNonPlayer = state.party.filter(m => m.isAlive && m.id !== playerId);

  const routeType = state.route?.type ?? 'fort_route';
  const encounterLabel =
    routeType === 'fort_route'           ? 'the fort gates'
    : routeType === 'entertainment_circuit' ? 'the circuit negotiation'
    : 'whatever\'s coming';

  const assign = (role: RoleKey, characterId: string) => {
    setAssignments(prev => {
      // toggle off if same character selected again for same role
      if (prev[role] === characterId) {
        const next = { ...prev };
        delete next[role];
        return next;
      }
      return { ...prev, [role]: characterId };
    });
  };

  const handleGoIn = () => {
    // Set role flags
    (Object.keys(assignments) as RoleKey[]).forEach(role => {
      const charId = assignments[role];
      if (charId) dispatch({ type: 'SET_FLAG', flag: `${role}:${charId}` });
    });
    // Prevent re-triggering today — router will now route to GATEKEEPER or ENTERTAINMENT_CIRCUIT
    dispatch({ type: 'SET_FLAG', flag: `DELEGATED_DAY_${state.day}` });
    // Re-enter FORT phase so router re-evaluates (DELEGATED_DAY flag now set, skips DELEGATION)
    setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'FORT' }), 500);
  };

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>Before the Encounter</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>
          DELEGATION
        </span>
      </div>

      <div style={{ padding: '80px clamp(16px,5vw,48px) 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--cream)', lineHeight: 1.6, margin: 0 }}>
          You&rsquo;re about to walk into {encounterLabel}. Who handles what?
        </p>

        {(Object.keys(ROLE_LABELS) as RoleKey[]).map(role => {
          const { label, desc } = ROLE_LABELS[role];
          const assignedId = assignments[role];
          return (
            <div key={role} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--gold-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                {label} <span style={{ color: 'var(--muted)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'none' }}>— {desc}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {aliveNonPlayer.map(member => {
                  const isSelected = assignedId === member.id;
                  const assignedElsewhere = !isSelected && Object.entries(assignments).some(
                    ([r, id]) => r !== role && id === member.id
                  );
                  return (
                    <button
                      key={member.id}
                      onClick={() => !assignedElsewhere && assign(role, member.id)}
                      disabled={assignedElsewhere}
                      style={{
                        background: 'none',
                        border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                        color: assignedElsewhere ? 'var(--muted)' : isSelected ? 'var(--gold)' : 'var(--cream)',
                        fontFamily: 'var(--font-serif)',
                        fontSize: '0.85rem',
                        padding: '4px 12px',
                        cursor: assignedElsewhere ? 'not-allowed' : 'pointer',
                        opacity: assignedElsewhere ? 0.4 : 1,
                        transition: 'all 150ms',
                      }}
                    >
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <button className={styles.advanceBtn} onClick={handleGoIn}>
            Go in &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
