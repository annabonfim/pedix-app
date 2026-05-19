// components/Tutti/TuttiMessage.jsx
// Bolha de mensagem (user → direita laranja, assistant → esquerda neutra)
// Welcome message tem layout especial: avatar GRANDE centralizado + texto centralizado

import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { colors, radius } from '../../styles/theme';

const AVATAR_GREETING = require('../../assets/tutti-greeting.png');
const AVATAR_RECOMMENDING = require('../../assets/tutti-recommending.png');
const AVATAR_OOPS = require('../../assets/tutti-oops.png');

function pickAvatar(message) {
  if (message.isError) return AVATAR_OOPS;
  return AVATAR_RECOMMENDING;
}

export function TuttiMessage({ message, onRetry }) {
  const { theme } = useTheme();
  const isUser = message.role === 'user';

  // Welcome: layout especial centralizado, sem balão de fundo
  if (message.isWelcome) {
    return (
      <View style={s.welcomeBlock}>
        <Image
          source={AVATAR_GREETING}
          style={s.welcomeAvatar}
          resizeMode="contain"
        />
        <Text
          style={[s.welcomeText, { color: theme.text }]}
          accessibilityLabel={`Tutti disse: ${message.content}`}
        >
          {message.content}
        </Text>
      </View>
    );
  }

  if (isUser) {
    return (
      <View style={s.userRow}>
        <View style={[s.bubbleUser, { backgroundColor: colors.orange }]}>
          <Text style={s.textUser} accessibilityLabel={`Você disse: ${message.content}`}>
            {message.content}
          </Text>
        </View>

        {/* Botão "Tentar novamente" quando a mensagem falhou */}
        {message.failed && onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={[s.retryBtn, { backgroundColor: theme.background, borderColor: colors.border }]}
            accessibilityLabel="Tentar enviar novamente"
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="refresh" size={14} color={colors.orange} />
            <Text style={[s.retryText, { color: colors.orange }]}>Tentar novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Assistant
  const avatar = pickAvatar(message);
  return (
    <View style={s.assistantRow}>
      <View style={s.avatarWrap}>
        <Image source={avatar} style={s.avatarImg} resizeMode="contain" />
      </View>
      <View
        style={[
          s.bubbleAssistant,
          { backgroundColor: theme.background, borderColor: colors.border },
        ]}
      >
        <Text
          style={[s.textAssistant, { color: theme.text }]}
          accessibilityLabel={`Tutti disse: ${message.content}`}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  // Welcome (layout especial: vertical centralizado, sem balão)
  welcomeBlock: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  welcomeAvatar: {
    width: 110,
    height: 200,
  },
  welcomeText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },

  // User (direita)
  userRow: {
    alignItems: 'flex-end',
    marginVertical: 4,
    maxWidth: '100%',
  },
  bubbleUser: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    maxWidth: '82%',
  },
  textUser: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  retryText: { fontSize: 12, fontWeight: '700' },

  // Assistant (esquerda)
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    gap: 8,
    maxWidth: '100%',
  },
  // Container do avatar (54x54) com overflow:hidden pra cropar o padding
  // transparente do PNG, mostrando só o robô em si maior
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Imagem maior que o container pra "zoom" visual no robô
  avatarImg: {
    width: 78,
    height: 78,
  },
  bubbleAssistant: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    maxWidth: '78%',
  },
  textAssistant: {
    fontSize: 14,
    lineHeight: 19,
  },
});
