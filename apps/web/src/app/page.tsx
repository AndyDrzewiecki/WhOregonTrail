'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();
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
        <button className={styles.startButton} onClick={() => router.push('/game')}>
          Begin the Journey
        </button>
        <p className={styles.note}>Requires Anthropic API key. Text + optional voice input.</p>
      </div>
      <div className={styles.vignette} />
    </main>
  );
}
