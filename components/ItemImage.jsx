import { View, Text, StyleSheet, Image } from 'react-native';

// Função para verificar se é uma URL válida
const isValidUrl = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('http://') || str.startsWith('https://');
};

// Função para verificar se é um emoji
const isEmoji = (str) => {
  if (!str || typeof str !== 'string') return false;
  // Emojis são caracteres Unicode especiais, não começam com http
  // Remove espaços e verifica se não é URL
  const trimmed = str.trim();
  if (isValidUrl(trimmed)) return false;
  // Se tem apenas caracteres especiais/emoji (não alfanuméricos comuns de URL)
  return trimmed.length > 0 && !trimmed.includes('.') && !trimmed.includes('/');
};

export function ItemImage({ source, emoji, size = 80 }) {
  // Prioridade 1: Se source é uma URL válida (http/https), mostra imagem
  if (source && isValidUrl(source)) {
    return (
      <Image
        source={{ uri: source }}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="cover"
      />
    );
  }

  // Prioridade 2: Se source é um emoji OU se emoji prop foi passado, mostra emoji
  const emojiToShow = (source && isEmoji(source)) ? source : (emoji || null);
  
  if (emojiToShow) {
    return (
      <View style={[styles.emojiContainer, { width: size, height: size }]}>
        <Text style={[styles.emoji, { fontSize: size * 0.6 }]}>{emojiToShow}</Text>
      </View>
    );
  }

  // Fallback: mostra emoji padrão
  return (
    <View style={[styles.emojiContainer, { width: size, height: size }]}>
      <Text style={[styles.emoji, { fontSize: size * 0.6 }]}>🍽️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 12,
  },
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  emoji: {
    textAlign: 'center',
  },
});

