import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  TRAIL_WAYPOINTS,
  getLocationDisplayName,
  getMilesBetween,
  type TrailLocation,
} from '@whoreagon-trail/game-engine';
import { COLORS } from '@/src/constants/colors';

interface TrailMapProps {
  visible: boolean;
  currentLocation: TrailLocation;
  totalMilesTraveled: number;
  onClose: () => void;
}

export default function TrailMap({ visible, currentLocation, totalMilesTraveled, onClose }: TrailMapProps) {
  const currentIndex = TRAIL_WAYPOINTS.indexOf(currentLocation);

  // Calculate total trail length
  let totalMiles = 0;
  for (let i = 0; i < TRAIL_WAYPOINTS.length - 1; i++) {
    totalMiles += getMilesBetween(TRAIL_WAYPOINTS[i], TRAIL_WAYPOINTS[i + 1]);
  }
  const milesRemaining = Math.max(0, totalMiles - totalMilesTraveled);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>TRAIL MAP</Text>
          <Text style={styles.summary}>
            {totalMilesTraveled} mi traveled · {milesRemaining} mi remaining
          </Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {TRAIL_WAYPOINTS.map((wp, i) => {
              const isVisited = i < currentIndex;
              const isCurrent = i === currentIndex;
              const isFuture = i > currentIndex;

              let marker = '  ○  ';
              if (isVisited) marker = '  ●  ';
              if (isCurrent) marker = ' ▶ ';

              const milesToNext =
                i < TRAIL_WAYPOINTS.length - 1
                  ? getMilesBetween(TRAIL_WAYPOINTS[i], TRAIL_WAYPOINTS[i + 1])
                  : 0;

              return (
                <View key={wp}>
                  <View style={styles.waypointRow}>
                    <Text
                      style={[
                        styles.marker,
                        isCurrent && styles.markerCurrent,
                        isVisited && styles.markerVisited,
                        isFuture && styles.markerFuture,
                      ]}
                    >
                      {marker}
                    </Text>
                    <Text
                      style={[
                        styles.waypointName,
                        isCurrent && styles.nameCurrent,
                        isVisited && styles.nameVisited,
                        isFuture && styles.nameFuture,
                      ]}
                    >
                      {getLocationDisplayName(wp)}
                    </Text>
                  </View>
                  {i < TRAIL_WAYPOINTS.length - 1 && (
                    <View style={styles.connectorRow}>
                      <Text style={styles.connector}>  │  </Text>
                      <Text style={styles.milesBetween}>{milesToNext} mi</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gold,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 8,
  },
  summary: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  scroll: {
    marginBottom: 16,
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marker: {
    fontSize: 14,
    fontFamily: 'monospace',
    width: 40,
    textAlign: 'center',
  },
  markerCurrent: {
    color: COLORS.gold,
  },
  markerVisited: {
    color: COLORS.muted,
  },
  markerFuture: {
    color: 'rgba(255,255,255,0.2)',
  },
  waypointName: {
    fontSize: 14,
    flex: 1,
  },
  nameCurrent: {
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  nameVisited: {
    color: COLORS.muted,
  },
  nameFuture: {
    color: 'rgba(255,255,255,0.3)',
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  connector: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.15)',
    fontFamily: 'monospace',
    width: 40,
    textAlign: 'center',
  },
  milesBetween: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
  },
  closeButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    borderRadius: 2,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
});
