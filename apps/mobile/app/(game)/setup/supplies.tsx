import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameState } from '@whoreagon-trail/game-engine';
import { router } from 'expo-router';
import { COLORS } from '@/src/constants/colors';

interface Quantities {
  food: number;
  water: number;
  ammunition: number;
  medicine: number;
  wheels: number;
  axles: number;
}

const STARTING_MONEY = 180;

const ITEMS = [
  { key: 'food', label: 'Food (lbs)', price: 0.2 },
  { key: 'water', label: 'Water (barrels)', price: 1.5 },
  { key: 'ammunition', label: 'Ammunition (boxes)', price: 2.0 },
  { key: 'medicine', label: 'Medicine (kits)', price: 5.0 },
  { key: 'wheels', label: 'Spare Wheels', price: 10.0 },
  { key: 'axles', label: 'Spare Axles', price: 10.0 },
];

export default function SuppliesScreen() {
  const { dispatch, state } = useGameState();
  const [quantities, setQuantities] = useState<Quantities>({
    food: 0,
    water: 0,
    ammunition: 0,
    medicine: 0,
    wheels: 0,
    axles: 0,
  });

  const partySize = state?.party?.length ?? 11;

  // Calculate total spent
  const totalSpent = useMemo(() => {
    let total = 0;
    total += quantities.food * 0.2;
    total += quantities.water * 1.5;
    total += quantities.ammunition * 2.0;
    total += quantities.medicine * 5.0;
    total += quantities.wheels * 10.0;
    total += quantities.axles * 10.0;
    return Math.round(total * 100) / 100;
  }, [quantities]);

  const remainingMoney = STARTING_MONEY - totalSpent;

  // Handle quantity increment
  const handleIncrement = (key: keyof Quantities, price: number) => {
    if (totalSpent + price <= STARTING_MONEY) {
      setQuantities((prev) => ({
        ...prev,
        [key]: prev[key] + 1,
      }));
    }
  };

  // Handle quantity decrement
  const handleDecrement = (key: keyof Quantities) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] - 1),
    }));
  };

  // Handle depart
  const handleDepart = () => {
    dispatch({
      type: 'UPDATE_RESOURCES',
      payload: {
        food: quantities.food,
        water: quantities.water,
        ammunition: quantities.ammunition * 20,
        medicine: quantities.medicine,
        wagonParts: {
          wheels: quantities.wheels,
          axles: quantities.axles,
          tongues: 1,
        },
        money: remainingMoney,
        oxenHealth: 100,
        wagonHealth: 100,
      },
    });

    dispatch({
      type: 'SET_PHASE',
      payload: { phase: 'TRAIL' },
    });

    router.push('/(game)/trail');
  };

  const renderItem = (
    item: (typeof ITEMS)[0],
    quantity: number,
    cost: number
  ) => {
    const isDisabled = totalSpent + item.price > STARTING_MONEY;

    return (
      <View key={item.key} style={styles.itemRow}>
        <View style={styles.itemLabel}>
          <Text style={styles.itemName}>{item.label}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => handleDecrement(item.key as keyof Quantities)}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.quantity}>{quantity}</Text>

          <TouchableOpacity
            onPress={() =>
              handleIncrement(item.key as keyof Quantities, item.price)
            }
            disabled={isDisabled}
            style={[
              styles.controlButton,
              isDisabled && styles.controlButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.controlButtonText,
                isDisabled && styles.controlButtonTextDisabled,
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.itemCost}>${cost.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLocation}>INDEPENDENCE, MISSOURI</Text>
          <Text style={styles.headerTitle}>The General Store</Text>
          <Text style={styles.headerFlavorText}>
            The man at the counter doesn't ask what you do for a living.
          </Text>
        </View>

        {/* Spending summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Spent: ${totalSpent.toFixed(2)} of ${STARTING_MONEY}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${(totalSpent / STARTING_MONEY) * 100}%`,
                  backgroundColor:
                    totalSpent > STARTING_MONEY ? COLORS.error : COLORS.gold,
                },
              ]}
            />
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsContainer}>
          {ITEMS.map((item) => {
            const quantity = quantities[item.key as keyof Quantities];
            const cost = quantity * item.price;
            return renderItem(item, quantity, cost);
          })}
        </View>

        {/* Recommended loadout note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteText}>
            A party of {partySize} needs roughly {partySize * 100} lbs of food
            for the full journey.
          </Text>
        </View>

        {/* Spacer for fixed bottom button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleDepart}
          style={styles.departButton}
          activeOpacity={0.8}
        >
          <Text style={styles.departButtonText}>Depart →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerLocation: {
    fontSize: 11,
    color: COLORS.goldDim,
    letterSpacing: 4,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.cream,
    marginTop: 8,
  },
  headerFlavorText: {
    fontSize: 13,
    color: COLORS.muted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  summaryRow: {
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.cream,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.darkCard,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.goldDim,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.gold,
  },
  itemsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  itemRow: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkCard,
  },
  itemLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    color: COLORS.cream,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 13,
    color: COLORS.goldDim,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 18,
    color: COLORS.gold,
    fontWeight: '600',
  },
  controlButtonTextDisabled: {
    color: COLORS.goldDim,
  },
  quantity: {
    fontSize: 16,
    color: COLORS.cream,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  itemCost: {
    fontSize: 12,
    color: COLORS.goldDim,
  },
  noteSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.muted,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: COLORS.darkCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.goldDim,
    padding: 16,
  },
  departButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 2,
    alignItems: 'center',
  },
  departButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cream,
    letterSpacing: 1,
  },
});
