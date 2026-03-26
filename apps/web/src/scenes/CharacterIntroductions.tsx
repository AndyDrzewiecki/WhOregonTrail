'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { GameState, GameAction } from '@whoreagon-trail/game-engine';
import { streamDialogue } from '@whoreagon-trail/ai-client';
import DialogueStream, { type DisplayMessage } from '@/components/DialogueStream';
import CommandBar from '@/components/CommandBar';
import { CHARACTER_FRAMES } from '@/lib/characterFraming';
import styles from './Scene.module.css';
import cardStyles from './CharacterCards.module.css';

interface Props { state: GameState | null; dispatch: (a: GameAction) => void; }

export default function CharacterIntroductions({ state, dispatch }: Props) {
  const [phase, setPhase] = useState<'cards' | 'dialogue'>('cards');
  const [visibleCards, setVisibleCards] = useState(0);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [exchanges, setExchanges] = useState(0);

  // Stagger card reveals
  useEffect(() => {
    if (phase !== 'cards') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    CHARACTER_FRAMES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCards(i + 1), i * 450 + 300));
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Start AI dialogue once player clicks Continue
  const startDialogue = useCallback(() => {
    setPhase('dialogue');
    if (!state) return;
    const streamingId = 'intro-0';
    setMessages([{ id: streamingId, text: '', isStreaming: true }]);
    let accumulated = '';
    streamDialogue(
      state,
      '__PARTY_ASSEMBLE__: The player has reviewed the roster and is now addressing the troupe for the first time. Pick 2-3 characters from the party to respond to the player\'s arrival. At least one should be visibly sizing up the player. One should be wary. One can be welcoming. Reference something specific about the wagon\'s situation — they are about to cross the frontier together and everyone knows the risks.',
      (chunk) => {
        accumulated += chunk;
        setMessages([{ id: streamingId, text: accumulated, isStreaming: true }]);
      }
    ).then((response) => {
      const display: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `intro-msg-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      }));
      setMessages(display);
      setInputEnabled(true);
    }).catch(() => {
      setMessages([{
        id: 'err',
        text: 'Delphine lights a cheroot without looking up. Someone in the back is arguing about a mule. You have approximately forty-five seconds before this becomes your problem.',
        isStreaming: false,
      }]);
      setInputEnabled(true);
    });
  }, [state]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!state) return;
    const playerMsg: DisplayMessage = { id: `p-${Date.now()}`, text, isPlayer: true };
    const streamingId = `s-${Date.now()}`;
    setMessages(prev => [...prev, playerMsg, { id: streamingId, text: '', isStreaming: true }]);
    setInputEnabled(false);
    let acc = '';
    await streamDialogue(state, text, (chunk) => {
      acc += chunk;
      setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, text: acc } : m));
    }).then((response) => {
      const newMsgs: DisplayMessage[] = response.dialogue.map((d, i) => ({
        id: `r-${Date.now()}-${i}`,
        characterId: d.characterId,
        characterName: d.characterId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        voiceTag: d.tone,
        text: d.text,
      }));
      setMessages(prev => [...prev.filter(m => m.id !== streamingId), ...newMsgs]);
      const next = exchanges + 1;
      setExchanges(next);
      if (next >= 2 || response.newFlags.some(f => f.includes('TRAIL'))) {
        const transitionId = `transition-${Date.now()}`;
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: transitionId,
            text: 'The wagon rolls west. Independence disappears behind you. Ahead: two thousand miles of frontier.',
            isStreaming: false,
          }]);
        }, 400);
        setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'TRAIL' }), 1800);
      }
    }).finally(() => setInputEnabled(true));
  }, [state, dispatch, exchanges]);

  if (phase === 'cards') {
    return (
      <div className={styles.scene}>
        <div className={styles.header}>
          <span className={styles.location}>Your Wagon — Who You Are Leading</span>
        </div>
        <div className={cardStyles.cardDeck}>
          {CHARACTER_FRAMES.map((frame, i) => (
            <div
              key={frame.id}
              className={`${cardStyles.card} ${i < visibleCards ? cardStyles.visible : ''}`}
            >
              <div className={cardStyles.cardHeader}>
                <span className={cardStyles.cardName}>{frame.name}</span>
                <span className={cardStyles.cardRole}>{frame.role}</span>
              </div>
              <div className={cardStyles.cardBody}>
                <div className={cardStyles.cardRow}>
                  <span className={cardStyles.cardLabel}>Strength</span>
                  <span className={cardStyles.cardValue}>{frame.strength}</span>
                </div>
                <div className={cardStyles.cardRow}>
                  <span className={cardStyles.cardLabel}>Liability</span>
                  <span className={`${cardStyles.cardValue} ${cardStyles.liability}`}>{frame.liability}</span>
                </div>
                <div className={cardStyles.cardRow}>
                  <span className={cardStyles.cardLabel}>In the Wagon</span>
                  <span className={cardStyles.cardValue}>{frame.economyNote}</span>
                </div>
                <p className={cardStyles.firstImpression}>{frame.firstImpression}</p>
              </div>
            </div>
          ))}
          {visibleCards >= CHARACTER_FRAMES.length && (
            <button className={cardStyles.continueBtn} onClick={startDialogue}>
              Address the troupe →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.scene}>
      <div className={styles.header}>
        <span className={styles.location}>The Blue Moon Saloon — The Troupe</span>
      </div>
      <DialogueStream messages={messages} />
      <CommandBar
        onSubmit={handleSubmit}
        disabled={!inputEnabled}
        placeholder="They need to hear it from you."
      />
    </div>
  );
}
