'use client';
import { useState, useEffect } from 'react';
import { isAudioEnabled, setAudioEnabled, playAtmosphere, getVolume, setVolume } from '@/lib/audioAtmosphere';

interface Props {
  scene?: string;
  routeType?: string | null;
}

export default function AudioToggle({ scene, routeType }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolumeState] = useState(0.7);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(isAudioEnabled());
    setVolumeState(getVolume());
  }, []);

  if (!mounted) return null;

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setAudioEnabled(next);
    if (next && scene) {
      playAtmosphere(routeType ?? null, scene);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolumeState(v);
    setVolume(v);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '6px',
      }}
    >
      {expanded && enabled && (
        <div style={{
          background: 'rgba(26,10,0,0.9)',
          border: '1px solid var(--muted)',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: 0.8,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
          }}>VOL</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolume}
            aria-label="Volume"
            style={{
              width: '72px',
              accentColor: 'var(--gold-dim)',
              cursor: 'pointer',
            }}
          />
        </div>
      )}
      <button
        onClick={toggle}
        onContextMenu={(e) => { e.preventDefault(); setExpanded(p => !p); }}
        onDoubleClick={() => setExpanded(p => !p)}
        title={enabled ? 'Mute (double-click for volume)' : 'Enable audio'}
        aria-label={enabled ? 'Mute ambient audio' : 'Enable ambient audio'}
        style={{
          background: 'transparent',
          border: '1px solid var(--muted)',
          color: 'var(--muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          padding: '4px 8px',
          cursor: 'pointer',
          opacity: 0.5,
          letterSpacing: '0.05em',
          minWidth: '60px',
        }}
      >
        {enabled ? '♪ sound' : '♪ off'}
      </button>
    </div>
  );
}
