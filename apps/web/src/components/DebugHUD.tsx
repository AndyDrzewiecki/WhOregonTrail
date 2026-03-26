'use client';
import React, { useState, useEffect } from 'react';
import type { GameState } from '@whoreagon-trail/game-engine';

interface Props { state: GameState | null; scene: string; }

export default function DebugHUD({ state, scene }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const params = new URLSearchParams(window.location.search);
    const lsFlag = typeof window !== 'undefined' ? localStorage.getItem('wt_debug') : null;
    setVisible(params.get('debug') === '1' || lsFlag === '1');
  }, []);

  // Toggle with Ctrl+D
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setVisible(v => {
          const next = !v;
          localStorage.setItem('wt_debug', next ? '1' : '0');
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!visible || !state) return null;

  const h = state.hiddenState;
  const m = state.runMemory;

  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 0,
      background: 'rgba(0,0,0,0.85)', border: '1px solid #444',
      padding: '8px 12px', fontSize: '0.6rem', fontFamily: 'monospace',
      color: '#aaa', zIndex: 9999, maxWidth: '320px', maxHeight: '50vh',
      overflowY: 'auto', lineHeight: 1.5,
    }}>
      <div style={{ color: '#ffcc00', marginBottom: '4px', fontSize: '0.65rem' }}>
        WT DEBUG — Ctrl+D to hide
      </div>
      <div><b>Scene:</b> {scene} | <b>Day:</b> {state.day} | <b>Phase:</b> {state.phase}</div>
      <div><b>Route:</b> {state.route?.type ?? 'none'}</div>
      <div style={{ marginTop: '4px', color: '#88aaff' }}>HIDDEN STATE</div>
      {h && Object.entries(h).map(([k, v]) => (
        <div key={k}>{k}: <span style={{ color: (v as number) > 60 ? '#ff8888' : (v as number) < 30 ? '#88ff88' : '#aaa' }}>{v}</span></div>
      ))}
      <div style={{ marginTop: '4px', color: '#88aaff' }}>MEMORY</div>
      <div>boundary crossed: {m?.boundaryCrossed ? '⚠️ yes' : 'no'}</div>
      <div>boundary defended: {m?.boundaryDefended ? '✓ yes' : 'no'}</div>
      <div>protected: {m?.protectedCharacterIds.join(', ') || 'none'}</div>
      <div>used: {m?.usedCharacterIds.join(', ') || 'none'}</div>
      {(m?.events.length ?? 0) > 0 && (
        <>
          <div style={{ marginTop: '4px', color: '#88aaff' }}>RECENT EVENTS</div>
          {m?.events.slice(-5).map((e, i) => (
            <div key={i} style={{ color: e.sentiment === 'positive' ? '#88ff88' : e.sentiment === 'negative' ? '#ff8888' : '#aaa' }}>
              D{e.day} {e.label}
            </div>
          ))}
        </>
      )}
      <div style={{ marginTop: '4px', color: '#88aaff' }}>FLAGS</div>
      <div style={{ fontSize: '0.55rem' }}>{state.flags.slice(-6).join(', ') || 'none'}</div>
    </div>
  );
}
