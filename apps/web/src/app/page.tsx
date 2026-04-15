'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

function hasSavedRun(): boolean {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('game:currentRun') : null;
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    // Must have a runId and not be in END phase
    return Boolean(parsed?.runId) && parsed?.phase !== 'END';
  } catch {
    return false;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [savedRun, setSavedRun] = useState(false);

  useEffect(() => {
    setSavedRun(hasSavedRun());
  }, []);

  const handleNewGame = () => {
    // Clear any existing save so START_RUN initializes clean
    try { window.localStorage.removeItem('game:currentRun'); } catch { /* ok */ }
    router.push('/game');
  };

  return (
    <main className={styles.landing}>
      <div className={styles.dust}>
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className={styles.particle} style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 15}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }} />
        ))}
      </div>
      <div className={styles.center}>
        <h1 className={styles.title}>WHOREAGON TRAIL</h1>
        <p className={styles.subtitle}>Independence, Missouri. 1848.</p>
        <p className={styles.tagline}>A burlesque troupe&apos;s passage west.</p>
        <p className={styles.premise}>
          Comedy. Frontier. Twelve people who shouldn&apos;t be in the same wagon.
        </p>

        {savedRun && (
          <button
            className={styles.startButton}
            style={{ marginTop: '32px' }}
            onClick={() => router.push('/game')}
          >
            Continue Journey &rarr;
          </button>
        )}

        <button
          className={styles.startButton}
          style={savedRun ? {
            marginTop: '8px',
            fontSize: '0.9rem',
            color: 'var(--muted)',
            borderBottomColor: 'var(--border)',
          } : { marginTop: '32px' }}
          onClick={handleNewGame}
        >
          {savedRun ? 'New Journey' : 'Begin the Journey'}
        </button>

        <p className={styles.note}>Requires Anthropic API key. Text + optional voice input.</p>
      </div>
      <div className={styles.vignette} />
    </main>
  );
}
