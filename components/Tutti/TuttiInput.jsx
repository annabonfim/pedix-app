// components/Tutti/TuttiInput.jsx
// Campo de texto + botão de enviar (multi-line, expande até ~3 linhas)

import { useState, useCallback } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { colors, radius } from '../../styles/theme';

// Altura aproximada de 3 linhas no font-size 14
const MAX_INPUT_HEIGHT = 80;

export function TuttiInput({ onSend, disabled }) {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    setInputHeight(40);
  }, [text, disabled, onSend]);

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View
      style={[
        s.wrapper,
        { backgroundColor: theme.surface, borderTopColor: colors.border },
      ]}
    >
      <View
        style={[
          s.inputBox,
          {
            backgroundColor: theme.background,
            borderColor: colors.border,
            height: Math.min(Math.max(40, inputHeight), MAX_INPUT_HEIGHT),
          },
        ]}
      >
        <TextInput
          style={[s.input, { color: theme.text }]}
          placeholder="Pergunte ao Tutti..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          editable={!disabled}
          onContentSizeChange={(e) =>
            setInputHeight(e.nativeEvent.contentSize.height)
          }
          accessibilityLabel="Campo de mensagem para o Tutti"
        />
      </View>

      <TouchableOpacity
        onPress={handleSend}
        disabled={!canSend}
        style={[
          s.sendBtn,
          { backgroundColor: canSend ? colors.orange : colors.border },
        ]}
        accessibilityLabel="Enviar mensagem"
        accessibilityRole="button"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        {disabled ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  inputBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    lineHeight: 19,
    paddingVertical: 0, // remove default Android padding interno
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
