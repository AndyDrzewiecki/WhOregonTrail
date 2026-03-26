import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  useGameState,
  TRAIL_WAYPOINTS,
  CONSUMPTION_RATES,
  MILES_PER_DAY,
  getLocationDisplayName,
  selectTrailEvent,
  type TrailEventTemplate,
  type TrailLocation,
} from '@whoreagon-trail/game-engine';
import { generateDialogue, type AIResponse } from '@whoreagon-trail/ai-client';
import EventCard from '@/src/components/EventCard';
import PartyModal from '@/src/components/PartyModal';
import TrailMap from '@/src/components/TrailMap';
import { COLORS } from '@/src/constants/colors';

const FORT_WAYPOINTS: TrailLocation[] = [
  'fort_kearney',
  'fort_laramie',
  'fort_bridger',
  'fort_hall',
  'fort_boise',
  'the_dalles',
];

type Pace = 'rest' | 'steady' | 'grueling';

const PACE_LABELS: Record<Pace, string> = {
  rest:     'Rest',
  steady:   'Steady',
  grueling: 'Grueling',
};

const PACE_NOTES: Record<Pace, string> = {
  rest:     '1.5 lb/person',
  steady:   '2.0 lb/person',
  grueling: '2.5 lb/person',
};

export default function TrailScreen() {
  const { state, dispatch } = useGameState();
  const [pace, setPace] = useState<Pace>('steady');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [activeEvent, setActiveEvent] = useState<TrailEventTemplate | null>(null);
  const [recentDeaths, setRecentDeaths] = useState<string[]>([]);
  const [deathReactionText, setDeathReactionText] = useState<string>('');
  const [showParty, setShowParty] = useState(false);
  const [showMap, setShowMap] = useState(false);

  if (state === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const aliveMembers = state.party.filter((m) => m.isAlive);
  const currentIndex = TRAIL_WAYPOINTS.indexOf(state.location);
  const progress = currentIndex / (TRAIL_WAYPOINTS.length - 1);

  const handleAdvanceDay = async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);

    // Project resource/health values locally (dispatch is async, state is stale)
    const aliveCount = state.party.filter(m => m.isAlive).length;
    const rate = CONSUMPTION_RATES[pace];
    const projectedFood = state.resources.food - aliveCount * rate.food;
    const projectedWater = state.resources.water - aliveCount * rate.water;
    const willStarve = projectedFood <= 0 || projectedWater <= 0;

    // Project who will die from starvation this tick
    const deathNames: string[] = [];
    const projectedAlive = state.party.filter(m => {
      if (!m.isAlive) return false;
      if (willStarve && m.health - 5 <= 0) {
        deathNames.push(m.name);
        return false;
      }
      return true;
    });

    // Advance day - engine handles resource consumption, miles, starvation, deaths
    dispatch({ type: 'ADVANCE_DAY', pace });

    if (deathNames.length > 0) {
      setRecentDeaths(deathNames);
      // Non-blocking death narrative reaction
      const deadMember = state.party.find(m => m.name === deathNames[0]);
      const deadCharacterId = deadMember?.id;
      if (deadCharacterId) {
        void (async () => {
          try {
            const deathResponse = await generateDialogue(
              state,
              `__CHARACTER_DEATH__:${deadCharacterId}`
            );
            if (deathResponse.dialogue.length > 0) {
              // Show first line of reaction in the death modal below the death notification
              setDeathReactionText(deathResponse.dialogue[0].text);
            }
          } catch {
            // Non-critical — death narrative failure should never block the game
          }
        })();
      }
    }
    if (projectedAlive.length === 0) {
      dispatch({ type: 'SET_PHASE', phase: 'END' });
      router.replace('/(game)/end');
      return;
    }

    // Check for random trail event
    const event = selectTrailEvent(state);
    if (event) {
      setActiveEvent(event);
      setIsAdvancing(false);
      return;
    }

    // Check if we've arrived at next waypoint
    const projectedMiles = state.milesUntilNextStop - MILES_PER_DAY[pace];
    if (projectedMiles <= 0) {
      dispatch({ type: 'ADVANCE_LOCATION' });
      const nextIndex = currentIndex + 1;
      if (nextIndex >= TRAIL_WAYPOINTS.length) {
        setIsAdvancing(false);
        return;
      }
      const nextLocation = TRAIL_WAYPOINTS[nextIndex];

      if (nextLocation === 'oregon_city') {
        dispatch({ type: 'SET_PHASE', phase: 'FINALE' });
        router.push('/(game)/finale');
        setIsAdvancing(false);
        return;
      } else if (FORT_WAYPOINTS.includes(nextLocation)) {
        setIsAdvancing(false);
        setTimeout(() => {
          router.push(`/(game)/fort/${nextLocation}`);
        }, 800);
        return;
      }
      // Non-fort waypoint (chimney_rock, south_pass) - just continue
    }

    setIsAdvancing(false);
  };

  const handleEventResolved = (response: AIResponse) => {
    // Apply health changes from events (can kill characters)
    if (response.eventOutcome?.healthChanges) {
      const eventDeaths: string[] = [];
      for (const hc of response.eventOutcome.healthChanges) {
        const member = state.party.find(m => m.id === hc.characterId);
        if (member && member.isAlive) {
          const newHealth = Math.max(0, member.health + hc.delta);
          dispatch({ type: 'UPDATE_CHARACTER_HEALTH', characterId: hc.characterId, health: newHealth });
          if (newHealth <= 0) {
            dispatch({ type: 'MARK_CHARACTER_DEAD', characterId: hc.characterId });
            eventDeaths.push(member.name);
          }
        }
      }
      if (eventDeaths.length > 0) {
        setRecentDeaths(prev => [...prev, ...eventDeaths]);
        // Non-blocking death narrative reaction
        const deadCharacterId = response.eventOutcome?.healthChanges?.find(
          hc => hc.delta + (state.party.find(m => m.id === hc.characterId)?.health ?? 100) <= 0
        )?.characterId;
        if (deadCharacterId) {
          void (async () => {
            try {
              const deathResponse = await generateDialogue(
                state,
                `__CHARACTER_DEATH__:${deadCharacterId}`
              );
              if (deathResponse.dialogue.length > 0) {
                // Show first line of reaction in the death modal below the death notification
                setDeathReactionText(deathResponse.dialogue[0].text);
              }
            } catch {
              // Non-critical — death narrative failure should never block the game
            }
          })();
        }
      }
    }

    // Apply resource changes
    if (response.eventOutcome?.resourceChanges) {
      const changes = response.eventOutcome.resourceChanges;
      const updatedChanges: Partial<import('@whoreagon-trail/game-engine').ResourceState> = {};
      const resourceKeys = ['food', 'water', 'money', 'oxenHealth', 'wagonHealth', 'ammunition', 'medicine'] as const;
      for (const key of resourceKeys) {
        const delta = changes[key];
        if (delta !== undefined) {
          const current = (state.resources as Record<string, number>)[key] ?? 0;
          (updatedChanges as Record<string, number>)[key] = current + delta;
        }
      }
      if (Object.keys(updatedChanges).length > 0) {
        dispatch({ type: 'UPDATE_RESOURCES', changes: updatedChanges });
      }
    }

    // Apply relationship deltas
    if (response.relationshipDeltas) {
      for (const [characterId, delta] of Object.entries(response.relationshipDeltas)) {
        dispatch({
          type: 'APPLY_RELATIONSHIP_DELTA',
          characterA: characterId,
          characterB: 'player',
          delta,
        });
      }
    }

    // Apply new flags
    if (response.newFlags) {
      for (const flag of response.newFlags) {
        dispatch({ type: 'SET_FLAG', flag });
      }
    }

    // Add event to history
    dispatch({
      type: 'ADD_EVENT',
      entry: {
        day: state.day,
        type: activeEvent?.type ?? 'trail_event',
        description: response.eventOutcome?.description ?? '',
        stressTag: response.stressTag,
        involvedCharacterIds: [],
        location: state.location,
      },
    });

    setActiveEvent(null);
  };

  const healthDotColor = (health: number) => {
    if (health > 60) return '#4caf50';
    if (health > 20) return COLORS.gold;
    return COLORS.error;
  };

  const { resources } = state;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dayText}>Day {state.day}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowParty(true)} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Party</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMap(true)} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(game)/settings')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Menu</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.locationText}>
          {state.milesUntilNextStop > 0 && currentIndex < TRAIL_WAYPOINTS.length - 1
            ? `${state.milesUntilNextStop} mi to ${getLocationDisplayName(TRAIL_WAYPOINTS[currentIndex + 1])}`
            : getLocationDisplayName(state.location)}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Resource HUD */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.resourceScroll}
        contentContainerStyle={styles.resourceRow}
      >
        <ResourcePill label="Food" value={`${Math.round(resources.food)} lb`} warn={resources.food < 20} />
        <ResourcePill label="Water" value={`${resources.water.toFixed(1)} bbl`} warn={resources.water < 1} />
        <ResourcePill label="Ammo" value={`${resources.ammunition}`} />
        <ResourcePill label="Med" value={`${resources.medicine}`} />
        <ResourcePill label="Money" value={`$${resources.money.toFixed(0)}`} />
        <ResourcePill label="Wagon" value={`${resources.wagonHealth}%`} />
        <ResourcePill label="Oxen" value={`${resources.oxenHealth}%`} />
      </ScrollView>

      {/* Party health strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.partyScroll}
        contentContainerStyle={styles.partyRow}
      >
        {aliveMembers.map((member) => (
          <Text key={member.id} style={styles.partyMember}>
            {member.name}{' '}
            <Text style={{ color: healthDotColor(member.health) }}>●</Text>
          </Text>
        ))}
      </ScrollView>

      {/* Pace picker */}
      <View style={styles.paceContainer}>
        <Text style={styles.paceLabel}>Pace</Text>
        <View style={styles.paceRow}>
          {(['rest', 'steady', 'grueling'] as Pace[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.paceButton, pace === p && styles.paceButtonSelected]}
              onPress={() => setPace(p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.paceButtonText, pace === p && styles.paceButtonTextSelected]}>
                {PACE_LABELS[p]}
              </Text>
              <Text style={styles.paceNote}>{PACE_NOTES[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Campfire button */}
      {(state.day > 0 && (state.day % 3 === 0 || pace === 'rest')) && (
        <TouchableOpacity
          style={styles.campfireButton}
          onPress={() => router.push('/(game)/campfire')}
          activeOpacity={0.7}
        >
          <Text style={styles.campfireButtonText}>Make Camp</Text>
        </TouchableOpacity>
      )}

      {/* Advance Day button */}
      <View style={styles.advanceContainer}>
        <TouchableOpacity
          style={[styles.advanceButton, isAdvancing && styles.advanceButtonDisabled]}
          onPress={handleAdvanceDay}
          disabled={isAdvancing}
          activeOpacity={0.8}
        >
          <Text style={styles.advanceButtonText}>Advance Day →</Text>
        </TouchableOpacity>
      </View>

      {/* Death notification */}
      {recentDeaths.length > 0 && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.deathBackdrop}>
            <View style={styles.deathCard}>
              {recentDeaths.map((name, i) => (
                <Text key={i} style={styles.deathText}>{name} has died on the trail.</Text>
              ))}
              {deathReactionText.length > 0 && (
                <Text style={styles.deathReactionText}>{deathReactionText}</Text>
              )}
              <TouchableOpacity
                style={styles.deathContinueButton}
                onPress={() => { setRecentDeaths([]); setDeathReactionText(''); }}
              >
                <Text style={styles.deathContinueText}>Press on</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Event modal */}
      {activeEvent !== null && (
        <EventCard
          event={activeEvent}
          gameState={state}
          onResolved={handleEventResolved}
          onDismiss={() => setActiveEvent(null)}
          onChoiceIntercept={(choice) => {
            if (activeEvent.type === 'hunting_opportunity' && choice.toLowerCase().includes('hunt it')) {
              setActiveEvent(null);
              router.push('/(game)/minigame/hunting');
              return true;
            }
            return false;
          }}
        />
      )}

      {/* Party modal */}
      <PartyModal
        visible={showParty}
        party={state.party}
        relationshipMatrix={state.relationshipMatrix}
        playerId={state.party[0]?.id ?? ''}
        onClose={() => setShowParty(false)}
      />

      {/* Trail map modal */}
      <TrailMap
        visible={showMap}
        currentLocation={state.location}
        totalMilesTraveled={state.totalMilesTraveled}
        onClose={() => setShowMap(false)}
      />
    </SafeAreaView>
  );
}

function ResourcePill({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={[styles.pill, warn && styles.pillWarn]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.goldDim,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexWrap: 'wrap',
  },
  dayText: {
    fontSize: 14,
    color: COLORS.cream,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
  },
  headerBtnText: {
    fontSize: 11,
    color: COLORS.goldDim,
    letterSpacing: 1,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.goldDim,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.darkCard,
    marginHorizontal: 16,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 3,
  },
  resourceScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  resourceRow: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillWarn: {
    borderColor: COLORS.error,
  },
  pillLabel: {
    fontSize: 10,
    color: COLORS.goldDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pillValue: {
    fontSize: 13,
    color: COLORS.cream,
    fontWeight: '600',
  },
  partyScroll: {
    flexGrow: 0,
    marginBottom: 20,
  },
  partyRow: {
    paddingHorizontal: 16,
    gap: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyMember: {
    fontSize: 13,
    color: COLORS.cream,
  },
  paceContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  paceLabel: {
    fontSize: 11,
    color: COLORS.goldDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  paceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paceButton: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 2,
    alignItems: 'center',
  },
  paceButtonSelected: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  paceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cream,
    marginBottom: 2,
  },
  paceButtonTextSelected: {
    color: COLORS.darkCard,
  },
  paceNote: {
    fontSize: 10,
    color: COLORS.muted,
  },
  advanceContainer: {
    paddingHorizontal: 16,
    marginTop: 'auto',
    paddingBottom: 16,
  },
  advanceButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  advanceButtonDisabled: {
    opacity: 0.5,
  },
  advanceButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkCard,
  },
  campfireButton: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingVertical: 12,
    borderRadius: 2,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  campfireButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gold,
  },
  deathBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deathCard: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 4,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  deathText: {
    fontSize: 16,
    color: COLORS.cream,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  deathReactionText: {
    fontSize: 13,
    color: COLORS.goldDim,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  deathContinueButton: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.muted,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 2,
    marginTop: 8,
  },
  deathContinueText: {
    fontSize: 14,
    color: COLORS.muted,
  },
});
