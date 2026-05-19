// components/Tutti/TuttiChatModal.jsx
// Bottom sheet com o chat do Tutti (~85% da altura da tela)

import { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Image, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTutti } from '../../hooks/useTutti';
import { TuttiMessage } from './TuttiMessage';
import { TuttiTypingIndicator } from './TuttiTypingIndicator';
import { TuttiInput } from './TuttiInput';
import { SuggestionChips } from './SuggestionChips';
import { colors, shadows } from '../../styles/theme';

const HEADER_AVATAR = require('../../assets/tutti-greeting.png');

export function TuttiChatModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const {
    messages,
    chipsVisible,
    hasUserInteracted,
    loading,
    sendMessage,
    retry,
  } = useTutti();
  const listRef = useRef(null);

  // Esconde o welcome banner assim que o usuário interage pela primeira vez.
  // Antes disso, welcome é a única mensagem (e os chips aparecem como footer).
  const visibleMessages = useMemo(
    () => (hasUserInteracted ? messages.filter((m) => !m.isWelcome) : messages),
    [messages, hasUserInteracted]
  );

  // Auto-scroll para o fim quando chegam novas mensagens ou loading muda
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(t);
  }, [visibleMessages.length, loading, visible]);

  const handleChipSelect = useCallback(
    (text) => sendMessage(text),
    [sendMessage]
  );

  const renderItem = useCallback(
    ({ item }) => <TuttiMessage message={item} onRetry={retry} />,
    [retry]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // Rodapé da lista: typing indicator (loading) OU chips (estado inicial) OU nada
  const renderFooter = useCallback(() => {
    if (loading) return <TuttiTypingIndicator />;
    if (chipsVisible) return <SuggestionChips onSelect={handleChipSelect} />;
    return null;
  }, [loading, chipsVisible, handleChipSelect]);

  const bottomPad = insets.bottom || (Platform.OS === 'ios' ? 12 : 8);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop: tap fora fecha */}
      <Pressable
        style={s.backdrop}
        onPress={onClose}
        accessibilityLabel="Fechar chat"
      />

      <View
        style={[
          s.sheet,
          {
            backgroundColor: theme.surface,
            paddingBottom: bottomPad,
          },
        ]}
      >
        {/* Drag handle visual (não funcional, só dica visual) */}
        <View style={[s.dragHandle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <View style={s.headerAvatarWrap}>
            <Image
              source={HEADER_AVATAR}
              style={s.headerAvatarImg}
              resizeMode="contain"
            />
          </View>
          <View style={s.headerText}>
            <Text style={[s.headerTitle, { color: theme.text }]}>Tutti</Text>
            <Text style={[s.headerSub, { color: theme.textSecondary }]}>
              Seu assistente de IA pra recomendações
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={s.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Fechar"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Lista de mensagens + input */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <FlatList
            ref={listRef}
            data={visibleMessages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={s.listContent}
            ListFooterComponent={renderFooter}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />

          <TuttiInput onSend={sendMessage} disabled={loading} />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.header,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  // Wrapper com overflow:hidden pra cropar padding transparente do PNG
  headerAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Imagem maior que o container pra "zoom" no robô em si
  headerAvatarImg: {
    width: 92,
    height: 92,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  closeBtn: { padding: 4 },
  listContent: { padding: 12, gap: 8 },
});
