import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS } from '@/src/constants/colors';
import { DialogueLog, type DisplayMessage } from '@/src/components/DialogueLog';
import { TypeBox } from '@/src/components/TypeBox';
import { useGameState } from '@whoreagon-trail/game-engine';
import {
  generateDialogue,
  streamDialogue,
  type AIResponse,
} from '@whoreagon-trail/ai-client';
import { characterStable } from '@whoreagon-trail/characters';
import { router } from 'expo-router';

export default function PrologueScreen() {
  const { state, dispatch } = useGameState();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accumulatedStreamRef = useRef<string>('');
  const streamingMessageIdRef = useRef<string>('');

  // Initialize game state
  useEffect(() => {
    if (state === null) {
      const foundingFour = [
        'delphine-marchais',
        'mama-szabo',
        'sister-agnes',
        'old-pete',
      ]
        .map((id) => characterStable.find((char) => char.id === id))
        .filter((char) => char !== undefined);

      dispatch({
        type: 'START_RUN',
        party: foundingFour,
      });
    }
  }, []);

  // Generate initial dialogue when state becomes available
  useEffect(() => {
    if (state !== null && !isReady) {
      const initializePrologue = async () => {
        try {
          setError(null);
          const result = await generateDialogue(state, '__SCENE_START__');
          const displayMessages: DisplayMessage[] = result.dialogue.map((msg) => ({
            id: Math.random().toString(36).slice(2),
            characterId: msg.characterId,
            characterName: characterStable.find((c) => c.id === msg.characterId)?.name ?? msg.characterId,
            text: msg.text,
            isPlayer: false,
          }));
          setMessages(displayMessages);
          setIsReady(true);
        } catch (err) {
          setError('The frontier is unforgiving.');
          console.error('Error generating initial dialogue:', err);
        }
      };

      initializePrologue();
    }
  }, [state, isReady]);

  const handlePlayerSubmit = async (playerText: string) => {
    if (!state) return;

    // Add player message
    const playerMessageId = Math.random().toString(36).slice(2);
    const playerMessage: DisplayMessage = {
      id: playerMessageId,
      characterId: 'player',
      characterName: 'You',
      text: playerText,
      isPlayer: true,
    };
    setMessages((prev) => [...prev, playerMessage]);

    setIsStreaming(true);
    accumulatedStreamRef.current = '';
    streamingMessageIdRef.current = Math.random().toString(36).slice(2);
    setError(null);

    try {
      const onChunk = (chunk: string) => {
        accumulatedStreamRef.current += chunk;
        const streamingMessage: DisplayMessage = {
          id: streamingMessageIdRef.current,
          characterId: 'narrator',
          characterName: '—',
          text: accumulatedStreamRef.current,
          isPlayer: false,
        };

        setMessages((prev) => {
          const idx = prev.findIndex(
            (msg) => msg.id === streamingMessageIdRef.current
          );
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = streamingMessage;
            return updated;
          }
          return [...prev, streamingMessage];
        });
      };

      const aiResponse: AIResponse = await streamDialogue(
        state,
        playerText,
        onChunk
      );

      // Remove streaming narrator message
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== streamingMessageIdRef.current)
      );

      // Add properly parsed dialogue
      const parsedMessages: DisplayMessage[] = (
        aiResponse.dialogue || []
      ).map((msg) => ({
        id: Math.random().toString(36).slice(2),
        characterId: msg.characterId,
        characterName: characterStable.find((c) => c.id === msg.characterId)?.name ?? msg.characterId,
        text: msg.text,
        isPlayer: false,
      }));
      setMessages((prev) => [...prev, ...parsedMessages]);

      // Apply relationship deltas
      if (aiResponse.relationshipDeltas) {
        Object.entries(aiResponse.relationshipDeltas).forEach(
          ([characterId, delta]) => {
            dispatch({
              type: 'APPLY_RELATIONSHIP_DELTA',
              characterA: characterId,
              characterB: 'player',
              delta,
            });
          }
        );
      }

      // Apply new flags
      if (aiResponse.newFlags) {
        aiResponse.newFlags.forEach((flag) => {
          dispatch({
            type: 'SET_FLAG',
            flag,
          });
        });
      }

      // Add event
      dispatch({
        type: 'ADD_EVENT',
        entry: {
          day: state.day,
          type: 'PROLOGUE',
          description: 'Prologue scene',
          involvedCharacterIds: [],
          location: 'independence_mo',
        },
      });

      // Check for prologue complete
      if (aiResponse.newFlags?.includes('PROLOGUE_COMPLETE')) {
        setTimeout(() => {
          router.push('/(game)/setup/characters');
        }, 1200);
      }

      setIsStreaming(false);
    } catch (err) {
      setIsStreaming(false);
      setError('The frontier is unforgiving.');
      console.error('Error streaming dialogue:', err);
    }
  };

  const handleRetry = async () => {
    if (!state || isReady) return;

    try {
      setError(null);
      const result = await generateDialogue(state, '__SCENE_START__');
      const displayMessages: DisplayMessage[] = result.dialogue.map((msg) => ({
        id: Math.random().toString(36).slice(2),
        characterId: msg.characterId,
        characterName: characterStable.find((c) => c.id === msg.characterId)?.name ?? msg.characterId,
        text: msg.text,
        isPlayer: false,
      }));
      setMessages(displayMessages);
      setIsReady(true);
    } catch (err) {
      setError('The frontier is unforgiving.');
      console.error('Error retrying dialogue:', err);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingYear}>1848</Text>
        <Text style={styles.loadingLocation}>Independence, Missouri</Text>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <ActivityIndicator
            size="large"
            color={COLORS.goldDim}
            style={styles.spinner}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DialogueLog messages={messages} isStreaming={isStreaming} />
      <View style={styles.typeBoxContainer}>
        <TypeBox
          onSubmit={handlePlayerSubmit}
          placeholder="What do you do?"
          disabled={isStreaming}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  typeBoxContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingYear: {
    color: COLORS.goldDim,
    fontSize: 32,
    letterSpacing: 6,
    marginBottom: 16,
  },
  loadingLocation: {
    color: COLORS.cream,
    fontSize: 18,
    marginBottom: 32,
  },
  spinner: {
    marginTop: 24,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  errorText: {
    color: COLORS.cream,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 4,
  },
  retryButtonText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
