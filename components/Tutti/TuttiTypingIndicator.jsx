// components/Tutti/TuttiTypingIndicator.jsx
// Indicador "Tutti tá pensando..." mostrado enquanto a API processa a mensagem

import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';

const AVATAR_THINKING = require('../../assets/tutti-thinking.png');

export function TuttiTypingIndicator() {
  const { theme } = useTheme();

  return (
    <View
      style={s.row}
      accessibilityLabel="Tutti está pensando"
      accessibilityRole="text"
    >
      <Image source={AVATAR_THINKING} style={s.avatar} resizeMode="contain" />
      <View
        style={[
          s.bubble,
          { backgroundColor: theme.background, borderColor: colors.border },
        ]}
      >
        <ActivityIndicator size="small" color={colors.orange} />
        <Text style={[s.label, { color: theme.textSecondary }]}>
          Tutti tá pensando...
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
    gap: 10,
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    minWidth: 110,
    alignItems: 'center',
  },
  label: { fontSize: 12, marginTop: 6, opacity: 0.8 },
});
