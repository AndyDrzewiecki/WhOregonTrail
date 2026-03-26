'use client';
import React from 'react';
import styles from './SceneTransition.module.css';

interface Props {
  sceneKey: string;
  children: React.ReactNode;
}

export default function SceneTransition({ sceneKey, children }: Props) {
  return (
    <div key={sceneKey} className={styles.transition}>
      {children}
    </div>
  );
}
