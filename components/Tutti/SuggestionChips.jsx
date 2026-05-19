// components/Tutti/SuggestionChips.jsx
// Chips iniciais que aparecem junto da mensagem de boas-vindas

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, radius } from '../../styles/theme';

const CHIPS = [
  'Quero algo doce',
  'Sou vegetariano',
  'Algo refrescante',
];

export function SuggestionChips({ onSelect }) {
  const { theme } = useTheme();

  return (
    <View
      style={s.wrapper}
      accessibilityLabel="Sugestões para começar"
      accessibilityRole="list"
    >
      {CHIPS.map((text) => (
        <TouchableOpacity
          key={text}
          onPress={() => onSelect(text)}
          style={[
            s.chip,
            { backgroundColor: colors.orangePale, borderColor: colors.orange },
          ]}
          accessibilityLabel={`Sugestão: ${text}`}
          accessibilityRole="button"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={[s.chipText, { color: colors.orange }]}>{text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 24,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});
