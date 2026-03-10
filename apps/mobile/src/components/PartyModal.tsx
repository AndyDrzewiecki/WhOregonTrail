import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { type PartyMember, type RelationshipMatrix, getRelationshipLabel } from '@whoreagon-trail/game-engine';
import { COLORS } from '@/src/constants/colors';

interface PartyModalProps {
  visible: boolean;
  party: PartyMember[];
  relationshipMatrix: RelationshipMatrix;
  playerId: string;
  onClose: () => void;
}

export default function PartyModal({ visible, party, relationshipMatrix, playerId, onClose }: PartyModalProps) {
  const healthBarColor = (health: number) => {
    if (health > 60) return '#4caf50';
    if (health > 20) return COLORS.gold;
    return COLORS.error;
  };

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>THE TROUPE</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {party.map((member) => {
              const relScore = relationshipMatrix[playerId]?.[member.id] ?? 0;
              const relLabel = getRelationshipLabel(relScore);
              return (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberHeader}>
                    <Text style={[styles.memberName, !member.isAlive && styles.deadName]}>
                      {member.name}
                    </Text>
                    {!member.isAlive && <Text style={styles.deadBadge}>DEAD</Text>}
                  </View>
                  {member.isAlive && (
                    <>
                      <View style={styles.healthBarBg}>
                        <View
                          style={[
                            styles.healthBarFill,
                            { width: `${member.health}%`, backgroundColor: healthBarColor(member.health) },
                          ]}
                        />
                      </View>
                      <Text style={styles.healthText}>{member.health} HP</Text>
                      {member.id !== playerId && (
                        <Text style={styles.relLabel}>{relLabel} ({relScore > 0 ? '+' : ''}{relScore})</Text>
                      )}
                    </>
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
    marginBottom: 16,
  },
  scroll: {
    marginBottom: 16,
  },
  memberRow: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,105,20,0.2)',
    paddingBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.cream,
  },
  deadName: {
    color: COLORS.muted,
    textDecorationLine: 'line-through',
  },
  deadBadge: {
    fontSize: 10,
    color: COLORS.error,
    letterSpacing: 2,
    marginLeft: 8,
  },
  healthBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  healthText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  relLabel: {
    fontSize: 12,
    color: COLORS.goldDim,
    fontStyle: 'italic',
    marginTop: 2,
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
