'use client';
import { useState, useEffect } from 'react';
import { isAudioEnabled, setAudioEnabled, playAtmosphere } from '@/lib/audioAtmosphere';

interface Props {
  scene?: string;
  routeType?: string | null;
}

export default function AudioToggle({ scene, routeType }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(isAudioEnabled());
  }, []);

  if (!mounted) return null;

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setAudioEnabled(next);
    // If re-enabling, restart atmosphere for current scene
    if (next && scene) {
      playAtmosphere(routeType ?? null, scene);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? 'Mute ambient audio' : 'Enable ambient audio'}
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        background: 'transparent',
        border: '1px solid var(--muted)',
        color: 'var(--muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        padding: '4px 8px',
        cursor: 'pointer',
        opacity: 0.5,
        zIndex: 100,
      }}
    >
      {enabled ? '♪ sound' : '♪ off'}
    </button>
  );
}
