/**
 * MINIGAME SCREEN — [gameId]
 *
 * Three-act structure per minigame:
 *
 * ACT 1 — SETUP: AI generates setup dialogue from current party.
 *   The instructor character gives instructions. Observers react.
 *   (The double meaning is entirely in this dialogue.)
 *
 * ACT 2 — PLAY: The MinigameEngine runs. Pure mechanics.
 *
 * ACT 3 — OUTCOME: AI generates outcome dialogue based on result tier.
 *   Characters react to what just happened. Relationship deltas apply.
 *
 * Navigation: push to this screen with gameId param.
 * On complete, go back to trail or fort depending on origin.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  getMinigameById,
  useGameState,
  type Phase,
} from '@whoreagon-trail/game-engine';
import { resolveEvent } from '@whoreagon-trail/ai-client';
import { MinigameEngine, type MinigameResult } from '@/components/minigames/MinigameEngine';
import type { AIResponse } from '@whoreagon-trail/ai-client';

type Act = 'loading' | 'setup' | 'play' | 'outcome';

// ── Helpers ────────────────────────────────────────────────────────────────

function pickInvolvedCharacters(
  party: string[],
  instructorCount: number,
  doerCount: number,
  observerCount: number
): { instructors: string[]; doers: string[]; observers: string[] } {
  // Shuffle deterministically by party order (random each run because party is AI-generated)
  const shuffled = [...party].sort(() => Math.random() - 0.5);
  const instructors = shuffled.slice(0, instructorCount);
  const doers = shuffled.slice(instructorCount, instructorCount + doerCount);
  const observers = shuffled.slice(
    instructorCount + doerCount,
    instructorCount + doerCount + observerCount
  );
  return { instructors, doers, observers };
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function MinigameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { state, dispatch } = useGameState();

  const [act, setAct] = useState<Act>('loading');
  const [setupDialogue, setSetupDialogue] = useState<AIResponse | null>(null);
  const [outcomeDialogue, setOutcomeDialogue] = useState<AIResponse | null>(null);
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [involvedIds, setInvolvedIds] = useState<string[]>([]);

  const config = gameId ? getMinigameById(gameId) : undefined;

  // ── ACT 1: Generate setup dialogue ─────────────────────────────────────

  useEffect(() => {
    if (!config || !state) return;

    const { instructors, doers, observers } = pickInvolvedCharacters(
      state.party,
      config.narrativeRoles.instructor,
      config.narrativeRoles.doer,
      config.narrativeRoles.observers
    );
    const involved = [...instructors, ...doers, ...observers];
    setInvolvedIds(involved);

    resolveEvent({
      partyCharacterIds: state.party,
      involvedCharacterIds: involved,
      triggerEvent: `MINIGAME_SETUP:${config.narrativeKey}`,
      currentFlags: state.flags,
      day: state.day,
      location: state.location,
      eventType: state.phase as 'TRAIL' | 'FORT',
      resourceStressLevel:
        state.resources.morale < 25 ? 'CRITICAL' :
        state.resources.morale < 50 ? 'HIGH' :
        state.resources.morale < 75 ? 'MEDIUM' : 'LOW',
    })
      .then((response) => {
        setSetupDialogue(response);
        setAct('setup');
      })
      .catch((err) => {
        console.error('[minigame] Setup dialogue failed:', err);
        // Skip setup dialogue on error — go straight to play
        setAct('play');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ACT 3: Generate outcome dialogue ────────────────────────────────────

  const handleMinigameComplete = useCallback(
    async (minigameResult: MinigameResult) => {
      setResult(minigameResult);
      setAct('outcome');

      if (!config || !state) return;

      // Apply rewards immediately
      const reward =
        minigameResult.tier === 'SUCCESS'
          ? config.rewards.success
          : minigameResult.tier === 'PARTIAL'
          ? config.rewards.partial
          : config.rewards.failure;

      dispatch({ type: 'UPDATE_RESOURCES', delta: reward });

      // Generate outcome dialogue
      try {
        const response = await resolveEvent({
          partyCharacterIds: state.party,
          involvedCharacterIds: involvedIds,
          triggerEvent: `MINIGAME_OUTCOME:${config.narrativeKey}:${minigameResult.tier}:score=${minigameResult.score}`,
          currentFlags: state.flags,
          day: state.day,
          location: state.location,
          eventType: state.phase as 'TRAIL' | 'FORT',
          resourceStressLevel: 'LOW',
        });

        // Apply relationship deltas from outcome
        if (response.relationshipDeltas) {
          dispatch({
            type: 'APPLY_RELATIONSHIP_DELTAS',
            deltas: response.relationshipDeltas,
          });
        }

        // Apply new flags
        for (const flag of response.newFlags ?? []) {
          dispatch({ type: 'ADD_FLAG', flag });
        }

        // Log the event
        dispatch({
          type: 'ADD_EVENT',
          entry: {
            day: state.day,
            type: 'MINIGAME',
            description: `${config.title}: ${minigameResult.tier} (${minigameResult.score}/100)`,
            stressTag: response.stressTag,
            involvedCharacterIds: involvedIds,
          },
        });

        setOutcomeDialogue(response);
      } catch (err) {
        console.error('[minigame] Outcome dialogue failed:', err);
      }
    },
    [config, state, dispatch, involvedIds]
  );

  // ── Navigation ───────────────────────────────────────────────────────────

  function handleContinue() {
    if ((state?.phase as Phase) === 'FORT') {
      router.back();
    } else {
      router.back();
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Unknown minigame: {gameId}</Text>
        <Pressable onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (act === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#8b6914" size="large" />
        <Text style={styles.loadingText}>Setting the scene…</Text>
      </View>
    );
  }

  if (act === 'setup' && setupDialogue) {
    return (
      <View style={styles.container}>
        <Text style={styles.sceneLabel}>SCENE</Text>
        <ScrollView style={styles.dialogueScroll} contentContainerStyle={styles.dialoguePad}>
          {setupDialogue.dialogue.map((line, i) => (
            <View key={i} style={styles.dialogueLine}>
              <Text style={styles.speaker}>{line.characterId}</Text>
              <Text style={styles.speech}>{line.text}</Text>
            </View>
          ))}
        </ScrollView>
        <Pressable style={styles.button} onPress={() => setAct('play')}>
          <Text style={styles.buttonText}>Begin</Text>
        </Pressable>
      </View>
    );
  }

  if (act === 'play') {
    return (
      <MinigameEngine
        config={config}
        onComplete={handleMinigameComplete}
      />
    );
  }

  // Outcome act
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.resultBanner,
          result?.tier === 'SUCCESS' && styles.resultSuccess,
          result?.tier === 'PARTIAL' && styles.resultPartial,
          result?.tier === 'FAILURE' && styles.resultFailure,
        ]}
      >
        {result?.tier ?? '—'} • {result?.score}/100
      </Text>

      {outcomeDialogue ? (
        <ScrollView style={styles.dialogueScroll} contentContainerStyle={styles.dialoguePad}>
          {outcomeDialogue.dialogue.map((line, i) => (
            <View key={i} style={styles.dialogueLine}>
              <Text style={styles.speaker}>{line.characterId}</Text>
              <Text style={styles.speech}>{line.text}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ActivityIndicator color="#8b6914" style={{ marginVertical: 32 }} />
      )}

      <Pressable
        style={[styles.button, !outcomeDialogue && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!outcomeDialogue}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a00',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  error: { color: '#f44336', fontSize: 16, marginBottom: 24 },
  loadingText: { color: '#8b6914', fontSize: 14, marginTop: 16, fontStyle: 'italic' },
  sceneLabel: {
    color: '#8b6914',
    fontSize: 11,
    letterSpacing: 4,
    marginBottom: 12,
  },
  dialogueScroll: { width: '100%', flex: 1 },
  dialoguePad: { paddingBottom: 24 },
  dialogueLine: { marginBottom: 20 },
  speaker: {
    color: '#8b6914',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  speech: {
    color: '#f5e6c8',
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  resultBanner: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 20,
    color: '#c9a96e',
  },
  resultSuccess: { color: '#4caf50' },
  resultPartial: { color: '#ff9800' },
  resultFailure: { color: '#f44336' },
  button: {
    borderWidth: 1,
    borderColor: '#8b6914',
    paddingHorizontal: 40,
    paddingVertical: 14,
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: '#f5e6c8',
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
