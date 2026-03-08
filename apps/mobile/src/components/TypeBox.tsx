import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS } from '@/src/constants/colors';

interface TypeBoxProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TypeBox: React.FC<TypeBoxProps> = ({
  onSubmit,
  placeholder = 'Enter your response...',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    const trimmedText = inputValue.trim();
    if (trimmedText.length === 0) {
      return;
    }
    onSubmit(trimmedText);
    setInputValue('');
  };

  const isInputEmpty = inputValue.trim().length === 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'height' : 'padding'}
      style={[styles.container, disabled && styles.disabled]}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.muted}
          value={inputValue}
          onChangeText={setInputValue}
          multiline={false}
          editable={!disabled}
          scrollEnabled={false}
        />
        <Pressable
          style={[
            styles.sendButton,
            isInputEmpty && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isInputEmpty || disabled}
        >
          <Text style={styles.sendButtonText}>→</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    opacity: 1,
  },
  disabled: {
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    color: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    padding: 12,
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: COLORS.gold,
    fontSize: 24,
    fontWeight: '600',
  },
});
