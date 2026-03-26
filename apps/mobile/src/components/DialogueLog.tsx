import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ViewToken,
} from 'react-native';
import { COLORS } from '@/src/constants/colors';

export type DisplayMessage = {
  id: string;
  characterId: string;
  characterName: string;
  text: string;
  isPlayer?: boolean;
};

interface DialogueLogProps {
  messages: DisplayMessage[];
  isStreaming?: boolean;
}

export const DialogueLog: React.FC<DialogueLogProps> = ({
  messages,
  isStreaming = false,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [cursorVisible, setCursorVisible] = useState(true);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manage cursor blinking
  useEffect(() => {
    if (isStreaming) {
      cursorIntervalRef.current = setInterval(() => {
        setCursorVisible((prev) => !prev);
      }, 500);
    } else {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
      setCursorVisible(true);
    }

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [isStreaming]);

  // Auto-scroll to end when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 0);
    }
  }, [messages.length]);

  const getItemLayout = (
    _data: ArrayLike<DisplayMessage> | null | undefined,
    index: number
  ): { length: number; offset: number; index: number } => {
    return { length: 60, offset: 60 * index, index };
  };

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isPlayer = item.isPlayer ?? false;
    const messageText =
      isStreaming &&
      item.characterId === 'narrator' &&
      cursorVisible
        ? item.text + '█'
        : item.text;

    return (
      <View
        style={[
          styles.messageContainer,
          isPlayer && styles.playerMessageContainer,
        ]}
      >
        <Text
          style={[
            styles.characterName,
            isPlayer && styles.playerCharacterName,
          ]}
        >
          {item.characterName}
        </Text>
        <Text
          style={[styles.messageText, isPlayer && styles.playerMessageText]}
        >
          {messageText}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      scrollEnabled={true}
      getItemLayout={getItemLayout}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 20,
  },
  playerMessageContainer: {
    alignItems: 'flex-end',
  },
  characterName: {
    color: COLORS.gold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
  },
  playerCharacterName: {
    color: COLORS.goldDim,
  },
  messageText: {
    color: COLORS.cream,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  playerMessageText: {
    color: '#f5e6c8',
  },
});
