import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { resolveEvent, type AIResponse } from '@whoreagon-trail/ai-client';
import { type TrailEventTemplate, type GameState } from '@whoreagon-trail/game-engine';
import { COLORS } from '@/src/constants/colors';

interface EventCardProps {
  event: TrailEventTemplate;
  gameState: GameState;
  onResolved: (response: AIResponse) => void;
  onDismiss: () => void;
  onChoiceIntercept?: (choiceText: string) => boolean;
}

type CardPhase = 'choice' | 'loading' | 'outcome';

export default function EventCard({ event, gameState, onResolved, onDismiss, onChoiceIntercept }: EventCardProps) {
  const [phase, setPhase] = useState<CardPhase>('choice');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChoicePress = async (choiceText: string) => {
    if (onChoiceIntercept?.(choiceText)) return;
    setPhase('loading');
    setError(null);
    try {
      const result = await resolveEvent(
        gameState,
        { type: event.type, description: event.description },
        choiceText
      );
      setResponse(result);
      setPhase('outcome');
    } catch {
      setError('The frontier is unforgiving. Try again.');
      setPhase('choice');
    }
  };

  const handleContinue = () => {
    if (response) {
      onResolved(response);
    }
    onDismiss();
  };

  const RESOURCE_LABELS: Record<string, string> = {
    food: 'Food',
    water: 'Water',
    money: 'Money',
    oxenHealth: 'Oxen',
    wagonHealth: 'Wagon',
    ammunition: 'Ammo',
    medicine: 'Medicine',
  };

  const renderResourceChange = (key: string, value: number) => {
    const isGain = value > 0;
    const label = RESOURCE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
    return (
      <Text
        key={key}
        style={[styles.resourceChange, isGain ? styles.gain : styles.loss]}
      >
        {isGain ? '+' : ''}{value} {label}
      </Text>
    );
  };

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {phase === 'choice' && (
            <>
              <Text style={styles.eventTitle}>{event.type.replace(/_/g, ' ').toUpperCase()}</Text>
              <Text style={styles.description}>{event.description}</Text>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <View style={styles.choicesContainer}>
                {event.choices.map((choice, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.choiceButton}
                    onPress={() => handleChoicePress(choice)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.choiceText}>{choice}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {phase === 'loading' && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Resolving...</Text>
              <ActivityIndicator size="large" color={COLORS.gold} style={styles.spinner} />
            </View>
          )}

          {phase === 'outcome' && response && (
            <>
              <Text style={styles.eventTitle}>{event.type.replace(/_/g, ' ').toUpperCase()}</Text>
              <ScrollView style={styles.outcomeScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.outcomeDescription}>
                  {response.eventOutcome?.description ?? 'The moment passes.'}
                </Text>
                {response.eventOutcome?.resourceChanges &&
                  Object.entries(response.eventOutcome.resourceChanges)
                    .filter(([, v]) => v !== undefined && v !== 0)
                    .map(([key, value]) => renderResourceChange(key, value as number))
                }
                {response.relationshipLabel && (
                  <Text style={styles.relationshipLabel}>
                    Relationship: {response.relationshipLabel}
                  </Text>
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    borderRadius: 4,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 12,
    letterSpacing: 1,
  },
  description: {
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  choicesContainer: {
    gap: 10,
  },
  choiceButton: {
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 2,
  },
  choiceText: {
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.goldDim,
    marginBottom: 16,
  },
  spinner: {},
  outcomeScroll: {
    maxHeight: 300,
    marginBottom: 16,
  },
  outcomeDescription: {
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  resourceChange: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gain: {
    color: '#4caf50',
  },
  loss: {
    color: COLORS.error,
  },
  relationshipLabel: {
    fontSize: 13,
    color: COLORS.goldDim,
    marginTop: 8,
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
});
