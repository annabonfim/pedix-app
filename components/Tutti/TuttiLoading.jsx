// components/Tutti/TuttiLoading.jsx
// Componente genérico de loading com o mascote Tutti.
// Reutilizado em qualquer tela onde precisamos esperar dados (>800ms).

import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';

const TUTTI_THINKING = require('../../assets/tutti-thinking.png');

const SIZES = { small: 40, medium: 80, large: 120 };

export function TuttiLoading({ size = 'medium', message, showSpinner = true }) {
  const { theme } = useTheme();
  const iconSize = SIZES[size] || SIZES.medium;

  return (
    <View
      style={s.container}
      accessibilityLabel={message || 'Carregando'}
      accessibilityRole="progressbar"
    >
      <Image
        source={TUTTI_THINKING}
        style={{ width: iconSize, height: iconSize }}
        resizeMode="contain"
      />
      {message ? (
        <Text style={[s.message, { color: theme.textSecondary }]}>
          {message}
        </Text>
      ) : null}
      {showSpinner ? (
        <ActivityIndicator size="small" color={colors.orange} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
});
