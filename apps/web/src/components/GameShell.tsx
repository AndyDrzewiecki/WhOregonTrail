'use client';
import React from 'react';
import styles from './GameShell.module.css';

export default function GameShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      {/* Dust layer */}
      <div className={styles.dust} aria-hidden>
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className={styles.particle} style={{
            left: `${(i * 17 + 3) % 100}%`,
            animationDuration: `${9 + (i * 3) % 11}s`,
            animationDelay: `${(i * 2.3) % 15}s`,
          }} />
        ))}
      </div>
      {/* Background glow */}
      <div className={styles.bgGlow} aria-hidden />
      {/* Content */}
      <div className={styles.content}>
        {children}
      </div>
      {/* Vignette */}
      <div className={styles.vignette} aria-hidden />
    </div>
  );
}
