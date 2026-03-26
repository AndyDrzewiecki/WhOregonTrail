import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGameState } from '@whoreagon-trail/game-engine';
import { streamDialogue, type AIResponse } from '@whoreagon-trail/ai-client';
import { characterStable } from '@whoreagon-trail/characters';
import { DialogueLog, type DisplayMessage } from '@/src/components/DialogueLog';
import { TypeBox } from '@/src/components/TypeBox';
import { COLORS } from '@/src/constants/colors';

const MAX_EXCHANGES = 3;

export default function CampfireScreen() {
  const { state, dispatch } = useGameState();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accumulatedStreamRef = useRef<string>('');
  const streamingMessageIdRef = useRef<string>('');
  const hasInitialized = useRef(false);

  // Generate opening campfire scene on mount
  useEffect(() => {
    if (!state || hasInitialized.current) return;
    hasInitialized.current = true;

    const initCampfire = async () => {
      setIsStreaming(true);
      accumulatedStreamRef.current = '';
      streamingMessageIdRef.current = Math.random().toString(36).slice(2);

      try {
        const onChunk = (chunk: string) => {
          accumulatedStreamRef.current += chunk;
          const streamingMessage: DisplayMessage = {
            id: streamingMessageIdRef.current,
            characterId: 'narrator',
            characterName: '\u2014',
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
          '__CAMPFIRE_START__',
          onChunk
        );

        // Replace streaming message with parsed dialogue
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== streamingMessageIdRef.current)
        );

        const parsedMessages: DisplayMessage[] = (
          aiResponse.dialogue || []
        ).map((msg) => ({
          id: Math.random().toString(36).slice(2),
          characterId: msg.characterId,
          characterName:
            characterStable.find((c) => c.id === msg.characterId)?.name ??
            msg.characterId,
          text: msg.text,
          isPlayer: false,
        }));
        setMessages(parsedMessages);

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

        // Apply flags
        if (aiResponse.newFlags) {
          aiResponse.newFlags.forEach((flag) => {
            dispatch({ type: 'SET_FLAG', flag });
          });

          if (aiResponse.newFlags.includes('CAMPFIRE_COMPLETE')) {
            setIsComplete(true);
          }
        }

        setIsStreaming(false);
      } catch (err) {
        setIsStreaming(false);
        setError('The fire sputters and dies.');
        console.error('Error generating campfire opening:', err);
      }
    };

    initCampfire();
  }, [state]);

  const handlePlayerSubmit = async (playerText: string) => {
    if (!state || isComplete) return;

    // Add player message
    const playerMessage: DisplayMessage = {
      id: Math.random().toString(36).slice(2),
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
          characterName: '\u2014',
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
        characterName:
          characterStable.find((c) => c.id === msg.characterId)?.name ??
          msg.characterId,
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

      // Apply flags
      if (aiResponse.newFlags) {
        aiResponse.newFlags.forEach((flag) => {
          dispatch({ type: 'SET_FLAG', flag });
        });

        if (aiResponse.newFlags.includes('CAMPFIRE_COMPLETE')) {
          setIsComplete(true);
        }
      }

      const newCount = exchangeCount + 1;
      setExchangeCount(newCount);

      // Auto-complete after max exchanges
      if (newCount >= MAX_EXCHANGES) {
        setIsComplete(true);
      }

      setIsStreaming(false);
    } catch (err) {
      setIsStreaming(false);
      setError('The fire sputters and dies.');
      console.error('Error streaming campfire dialogue:', err);
    }
  };

  const handleReturnToTrail = () => {
    dispatch({
      type: 'ADD_EVENT',
      entry: {
        day: state?.day ?? 1,
        type: 'CAMPFIRE',
        description: 'Night camp conversation',
        involvedCharacterIds: [],
        location: 'trail',
      },
    });
    router.push('/(game)/trail');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <Text style={styles.title}>Night Camp</Text>
          <TouchableOpacity
            onPress={() => router.push('/(game)/settings')}
            style={{ position: 'absolute', right: 16, borderWidth: 1, borderColor: COLORS.goldDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 }}
          >
            <Text style={{ fontSize: 11, color: COLORS.goldDim, letterSpacing: 1 }}>Menu</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Day {state?.day ?? '...'}</Text>
        {!isComplete && exchangeCount > 0 && (
          <Text style={styles.exchangeCounter}>
            Exchange {exchangeCount}/{MAX_EXCHANGES}
          </Text>
        )}
      </View>

      {/* Dialogue */}
      <DialogueLog messages={messages} isStreaming={isStreaming} />

      {/* Input or Return button */}
      <View style={styles.bottomContainer}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        {isComplete ? (
          <TouchableOpacity
            style={styles.returnButton}
            onPress={handleReturnToTrail}
          >
            <Text style={styles.returnButtonText}>Return to Trail</Text>
          </TouchableOpacity>
        ) : (
          <TypeBox
            onSubmit={handlePlayerSubmit}
            placeholder="Speak into the firelight..."
            disabled={isStreaming}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.muted,
  },
  title: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  subtitle: {
    color: COLORS.goldDim,
    fontSize: 14,
    marginTop: 4,
  },
  exchangeCounter: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  returnButton: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 4,
  },
  returnButtonText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
