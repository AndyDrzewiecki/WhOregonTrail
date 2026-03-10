import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { type MinigameConfig } from '@whoreagon-trail/game-engine';
import { COLORS } from '@/src/constants/colors';

interface Target {
  id: number;
  x: number;
  y: number;
  spawnedAt: number;
  opacity: Animated.Value;
}

interface TapMechanicProps {
  config: MinigameConfig;
  onComplete: (hits: number, misses: number) => void;
}

const PLAY_AREA_HEIGHT = 400;
const TARGET_SIZE = 60;

const ANIMALS = ['🦌', '🐇', '🦃', '🐿️', '🦆'];

export default function TapMechanic({ config, onComplete }: TapMechanicProps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.durationMs);
  const [isActive, setIsActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const nextId = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const playWidth = screenWidth - 48;

  const spawnTarget = useCallback(() => {
    const id = nextId.current++;
    const x = Math.random() * (playWidth - TARGET_SIZE);
    const y = Math.random() * (PLAY_AREA_HEIGHT - TARGET_SIZE);
    const opacity = new Animated.Value(0);

    const target: Target = { id, x, y, spawnedAt: Date.now(), opacity };

    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTargets(prev => [...prev, target]);

    // Auto-remove after lifetime (miss)
    setTimeout(() => {
      setTargets(prev => {
        const still = prev.find(t => t.id === id);
        if (still) {
          setMisses(m => m + 1);
          return prev.filter(t => t.id !== id);
        }
        return prev;
      });
    }, config.targetLifetimeMs);
  }, [playWidth, config.targetLifetimeMs]);

  const handleTap = useCallback((targetId: number) => {
    setTargets(prev => prev.filter(t => t.id !== targetId));
    setHits(h => h + 1);
  }, []);

  const startGame = useCallback(() => {
    setHasStarted(true);
    setIsActive(true);
    setTimeLeft(config.durationMs);
    setHits(0);
    setMisses(0);
    setTargets([]);
  }, [config.durationMs]);

  // Spawn timer
  useEffect(() => {
    if (!isActive) return;
    spawnTimer.current = setInterval(spawnTarget, config.spawnIntervalMs);
    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
    };
  }, [isActive, spawnTarget, config.spawnIntervalMs]);

  // Game countdown
  useEffect(() => {
    if (!isActive) return;
    gameTimer.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 100;
        if (next <= 0) {
          setIsActive(false);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => {
      if (gameTimer.current) clearInterval(gameTimer.current);
    };
  }, [isActive]);

  // Game over
  useEffect(() => {
    if (hasStarted && !isActive && timeLeft <= 0) {
      const timer = setTimeout(() => onComplete(hits, misses), 500);
      return () => clearTimeout(timer);
    }
  }, [hasStarted, isActive, timeLeft, hits, misses, onComplete]);

  const seconds = Math.ceil(timeLeft / 1000);

  if (!hasStarted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.instructions}>
          Tap the animals as they appear!{'\n'}
          You have {config.durationMs / 1000} seconds.
        </Text>
        <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.8}>
          <Text style={styles.startText}>Begin Hunt</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isActive && timeLeft <= 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>HUNT OVER</Text>
        <Text style={styles.resultText}>Hits: {hits}</Text>
        <Text style={styles.resultText}>Missed: {misses}</Text>
        <Text style={styles.resultSubtext}>
          {hits > 0 ? `+${Math.round((config.reward.food ?? 0) * (hits / config.targetCount))} lb food earned` : 'No food earned'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hud}>
        <Text style={styles.hudText}>Hits: {hits}</Text>
        <Text style={styles.hudTimer}>{seconds}s</Text>
        <Text style={styles.hudText}>Miss: {misses}</Text>
      </View>
      <View style={[styles.playArea, { height: PLAY_AREA_HEIGHT }]}>
        {targets.map((target) => (
          <Animated.View
            key={target.id}
            style={[
              styles.target,
              {
                left: target.x,
                top: target.y,
                opacity: target.opacity,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleTap(target.id)}
              activeOpacity={0.6}
              style={styles.targetTouchable}
            >
              <Text style={styles.targetEmoji}>
                {ANIMALS[target.id % ANIMALS.length]}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gold,
    letterSpacing: 3,
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 2,
  },
  startText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  hudText: {
    fontSize: 14,
    color: COLORS.cream,
    fontWeight: '600',
  },
  hudTimer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  playArea: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(139,105,20,0.3)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  target: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  },
  targetTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetEmoji: {
    fontSize: 36,
  },
  resultText: {
    fontSize: 18,
    color: COLORS.cream,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 14,
    color: COLORS.goldDim,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
