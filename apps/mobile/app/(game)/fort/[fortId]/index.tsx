import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  useGameState,
  CONSUMPTION_RATES,
  getLocationDisplayName,
} from '@whoreagon-trail/game-engine';
import { streamDialogue, type AIResponse } from '@whoreagon-trail/ai-client';
import { characterStable } from '@whoreagon-trail/characters';
import { DialogueLog, type DisplayMessage } from '@/src/components/DialogueLog';
import { TypeBox } from '@/src/components/TypeBox';
import { COLORS } from '@/src/constants/colors';

type FortView = 'hub' | 'show' | 'trade' | 'rest';

interface TradeCart {
  food: number;
  water: number;
  ammo: number;
  medicine: number;
  wheel: number;
  axle: number;
}

const FORT_PRICES = {
  food:     { label: 'Food (lbs)',       unitLabel: '$0.30/lb',  price: 0.30 },
  water:    { label: 'Water (barrels)',  unitLabel: '$2.00/bbl', price: 2.00 },
  ammo:     { label: 'Ammunition (boxes)', unitLabel: '$3.00/box', price: 3.00 },
  medicine: { label: 'Medicine (kits)', unitLabel: '$8.00/kit',  price: 8.00 },
  wheel:    { label: 'Spare Wheel',      unitLabel: '$15.00 ea', price: 15.00 },
  axle:     { label: 'Spare Axle',       unitLabel: '$15.00 ea', price: 15.00 },
};

export default function FortScreen() {
  const { fortId } = useLocalSearchParams<{ fortId: string }>();
  const { state, dispatch } = useGameState();

  const [view, setView] = useState<FortView>('hub');

  // Show state
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [earnings, setEarnings] = useState<number | null>(null);
  const accumulatedRef = useRef('');
  const streamingIdRef = useRef('');

  // Trade state
  const [cart, setCart] = useState<TradeCart>({ food: 0, water: 0, ammo: 0, medicine: 0, wheel: 0, axle: 0 });

  // Rest state
  const [restDays, setRestDays] = useState(1);

  useEffect(() => {
    if (state && state.phase !== 'FORT') {
      dispatch({ type: 'SET_PHASE', phase: 'FORT' });
    }
  }, []);

  if (!state) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const fortName = getLocationDisplayName((fortId as string) as any) ?? fortId;

  // ── Hub ────────────────────────────────────────────────────────────────────

  const handleHeadOut = () => {
    dispatch({ type: 'SET_PHASE', phase: 'TRAIL' });
    dispatch({ type: 'ADVANCE_LOCATION' });
    router.replace('/(game)/trail');
  };

  // ── Show ───────────────────────────────────────────────────────────────────

  const handleShowSubmit = async (playerText: string) => {
    if (!state) return;

    const playerMsg: DisplayMessage = {
      id: Math.random().toString(36).slice(2),
      characterId: 'player',
      characterName: 'You',
      text: playerText,
      isPlayer: true,
    };
    setMessages((prev) => [...prev, playerMsg]);

    setIsStreaming(true);
    accumulatedRef.current = '';
    streamingIdRef.current = Math.random().toString(36).slice(2);

    try {
      const onChunk = (chunk: string) => {
        accumulatedRef.current += chunk;
        const streamingMsg: DisplayMessage = {
          id: streamingIdRef.current,
          characterId: 'narrator',
          characterName: '—',
          text: accumulatedRef.current,
          isPlayer: false,
        };
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === streamingIdRef.current);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = streamingMsg;
            return updated;
          }
          return [...prev, streamingMsg];
        });
      };

      const response: AIResponse = await streamDialogue(state, playerText, onChunk);

      setMessages((prev) => prev.filter((m) => m.id !== streamingIdRef.current));

      const parsed: DisplayMessage[] = (response.dialogue ?? []).map((msg) => ({
        id: Math.random().toString(36).slice(2),
        characterId: msg.characterId,
        characterName: characterStable.find((c) => c.id === msg.characterId)?.name ?? msg.characterId,
        text: msg.text,
        isPlayer: false,
      }));
      setMessages((prev) => [...prev, ...parsed]);

      if (response.newFlags) {
        for (const flag of response.newFlags) {
          dispatch({ type: 'SET_FLAG', flag });
        }
      }

      const isDone =
        response.newFlags?.includes('FORT_SHOW_COMPLETE') ||
        playerText.toLowerCase().includes('done') ||
        playerText.toLowerCase().includes('leave');

      if (isDone && earnings === null) {
        const result = response.eventOutcome?.result ?? 'partial_success';
        const earned = result === 'success' ? 60 : result === 'partial_success' ? 30 : 10;
        setEarnings(earned);
        dispatch({
          type: 'UPDATE_RESOURCES',
          changes: { money: state.resources.money + earned },
        });
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== streamingIdRef.current));
    } finally {
      setIsStreaming(false);
    }
  };

  // ── Trade ──────────────────────────────────────────────────────────────────

  const cartTotal = Object.entries(cart).reduce((sum, [key, qty]) => {
    return sum + qty * FORT_PRICES[key as keyof TradeCart].price;
  }, 0);

  const handleCartChange = (key: keyof TradeCart, delta: number) => {
    setCart((prev) => {
      const next = prev[key] + delta;
      if (next < 0) return prev;
      const nextTotal = cartTotal + delta * FORT_PRICES[key].price;
      if (delta > 0 && nextTotal > state.resources.money) return prev;
      return { ...prev, [key]: next };
    });
  };

  const handlePurchase = () => {
    dispatch({
      type: 'UPDATE_RESOURCES',
      changes: {
        food: state.resources.food + cart.food,
        water: state.resources.water + cart.water,
        ammunition: state.resources.ammunition + cart.ammo * 20,
        medicine: state.resources.medicine + cart.medicine,
        money: state.resources.money - cartTotal,
        wagonParts: {
          wheels: state.resources.wagonParts.wheels + cart.wheel,
          axles: state.resources.wagonParts.axles + cart.axle,
          tongues: state.resources.wagonParts.tongues,
        },
      },
    });
    setCart({ food: 0, water: 0, ammo: 0, medicine: 0, wheel: 0, axle: 0 });
    setView('hub');
  };

  // ── Rest ───────────────────────────────────────────────────────────────────

  const handleRest = () => {
    for (let i = 0; i < restDays; i++) {
      dispatch({ type: 'ADVANCE_DAY', pace: 'rest' });
    }
    const aliveMembers = state.party.filter((m) => m.isAlive);
    for (const member of aliveMembers) {
      dispatch({
        type: 'UPDATE_CHARACTER_HEALTH',
        characterId: member.id,
        health: Math.min(100, member.health + 10 * restDays),
      });
    }
    setView('hub');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (view === 'hub') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Text style={styles.fortTitle}>{fortName}</Text>
        <Text style={styles.fortSubtitle}>You have reached the fort.</Text>

        <View style={styles.hubButtons}>
          <TouchableOpacity style={styles.hubButtonGold} onPress={() => setView('show')} activeOpacity={0.8}>
            <Text style={styles.hubButtonGoldText}>Book a Show</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.hubButtonOutline} onPress={() => setView('trade')} activeOpacity={0.8}>
            <Text style={styles.hubButtonOutlineText}>Trade Supplies</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.hubButtonOutline} onPress={() => setView('rest')} activeOpacity={0.8}>
            <Text style={styles.hubButtonOutlineText}>Rest the Party</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.hubButtonMuted} onPress={handleHeadOut} activeOpacity={0.8}>
            <Text style={styles.hubButtonMutedText}>Head Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (view === 'show') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.backButton} onPress={() => { setView('hub'); setEarnings(null); setMessages([]); }}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.viewTitle}>The Show</Text>

        {earnings !== null && (
          <View style={styles.earningsBanner}>
            <Text style={styles.earningsText}>Earned ${earnings} from the performance!</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <DialogueLog messages={messages} isStreaming={isStreaming} />
        </View>

        {earnings === null ? (
          <View style={styles.typeBoxContainer}>
            <TypeBox
              onSubmit={handleShowSubmit}
              placeholder="Perform, speak, or leave..."
              disabled={isStreaming}
            />
          </View>
        ) : (
          <View style={styles.backToFortContainer}>
            <TouchableOpacity
              style={styles.backToFortButton}
              onPress={() => { setView('hub'); setEarnings(null); setMessages([]); }}
            >
              <Text style={styles.backToFortText}>Back to Fort</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (view === 'trade') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.backButton} onPress={() => setView('hub')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.viewTitle}>Trade Supplies</Text>
        <Text style={styles.moneyLine}>Money: ${state.resources.money.toFixed(2)}</Text>

        <ScrollView style={styles.tradeScroll} showsVerticalScrollIndicator={false}>
          {(Object.keys(FORT_PRICES) as (keyof TradeCart)[]).map((key) => {
            const item = FORT_PRICES[key];
            const qty = cart[key];
            const costSoFar = qty * item.price;
            const canAdd = cartTotal + item.price <= state.resources.money;

            return (
              <View key={key} style={styles.tradeRow}>
                <View style={styles.tradeLabelCol}>
                  <Text style={styles.tradeItemLabel}>{item.label}</Text>
                  <Text style={styles.tradeItemPrice}>{item.unitLabel}</Text>
                </View>
                <View style={styles.tradeControls}>
                  <TouchableOpacity
                    style={styles.tradeControlBtn}
                    onPress={() => handleCartChange(key, -1)}
                    disabled={qty === 0}
                  >
                    <Text style={[styles.tradeControlBtnText, qty === 0 && styles.dimText]}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.tradeQty}>{qty}</Text>
                  <TouchableOpacity
                    style={styles.tradeControlBtn}
                    onPress={() => handleCartChange(key, 1)}
                    disabled={!canAdd}
                  >
                    <Text style={[styles.tradeControlBtnText, !canAdd && styles.dimText]}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.tradeItemCost}>${costSoFar.toFixed(2)}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.tradeSummary}>
          <Text style={styles.tradeTotalText}>Total: ${cartTotal.toFixed(2)}</Text>
          <TouchableOpacity
            style={[styles.purchaseButton, cartTotal === 0 && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={cartTotal === 0}
          >
            <Text style={styles.purchaseButtonText}>Purchase</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelTradeButton} onPress={() => setView('hub')}>
            <Text style={styles.cancelTradeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // rest view
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.backButton} onPress={() => setView('hub')}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.viewTitle}>Rest the Party</Text>
      <Text style={styles.restDescription}>
        Each day of rest restores 10 HP to every alive party member.
      </Text>

      <View style={styles.restPickerRow}>
        {[1, 2, 3].map((days) => (
          <TouchableOpacity
            key={days}
            style={[styles.restDayButton, restDays === days && styles.restDayButtonSelected]}
            onPress={() => setRestDays(days)}
          >
            <Text style={[styles.restDayText, restDays === days && styles.restDayTextSelected]}>
              {days} {days === 1 ? 'Day' : 'Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.restNote}>
        Consumes {state.party.filter((m) => m.isAlive).length * CONSUMPTION_RATES.rest.food * restDays} lbs food,{' '}
        {(state.party.filter((m) => m.isAlive).length * CONSUMPTION_RATES.rest.water * restDays).toFixed(1)} barrels water.
      </Text>

      <TouchableOpacity style={styles.restButton} onPress={handleRest} activeOpacity={0.8}>
        <Text style={styles.restButtonText}>Rest</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelTradeButton} onPress={() => setView('hub')}>
        <Text style={styles.cancelTradeText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
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
  fortTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.cream,
    marginBottom: 4,
    marginTop: 8,
  },
  fortSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    fontStyle: 'italic',
    marginBottom: 32,
  },
  hubButtons: {
    gap: 12,
  },
  hubButtonGold: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  hubButtonGoldText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
  hubButtonOutline: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  hubButtonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cream,
  },
  hubButtonMuted: {
    backgroundColor: COLORS.muted,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  hubButtonMutedText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.goldDim,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.goldDim,
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.cream,
    marginBottom: 16,
  },
  moneyLine: {
    fontSize: 14,
    color: COLORS.gold,
    marginBottom: 12,
  },
  earningsBanner: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: 12,
    borderRadius: 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  earningsText: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: '600',
  },
  typeBoxContainer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  backToFortContainer: {
    paddingTop: 12,
  },
  backToFortButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
  },
  backToFortText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
  tradeScroll: {
    flex: 1,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkCard,
  },
  tradeLabelCol: {
    flex: 1,
  },
  tradeItemLabel: {
    fontSize: 15,
    color: COLORS.cream,
    fontWeight: '600',
  },
  tradeItemPrice: {
    fontSize: 12,
    color: COLORS.goldDim,
    marginTop: 2,
  },
  tradeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
  },
  tradeControlBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  tradeControlBtnText: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: '600',
  },
  tradeQty: {
    fontSize: 15,
    color: COLORS.cream,
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  tradeItemCost: {
    fontSize: 13,
    color: COLORS.goldDim,
    width: 50,
    textAlign: 'right',
  },
  dimText: {
    opacity: 0.4,
  },
  tradeSummary: {
    paddingTop: 16,
    gap: 10,
  },
  tradeTotalText: {
    fontSize: 16,
    color: COLORS.cream,
    fontWeight: '700',
    marginBottom: 4,
  },
  purchaseButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.4,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
  cancelTradeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelTradeText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  restDescription: {
    fontSize: 14,
    color: COLORS.muted,
    fontStyle: 'italic',
    marginBottom: 24,
    lineHeight: 20,
  },
  restPickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  restDayButton: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
  },
  restDayButtonSelected: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  restDayText: {
    fontSize: 15,
    color: COLORS.cream,
    fontWeight: '600',
  },
  restDayTextSelected: {
    color: COLORS.darkCard,
  },
  restNote: {
    fontSize: 12,
    color: COLORS.muted,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  restButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
    marginBottom: 10,
  },
  restButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
});
