// components/Tutti/TuttiFAB.jsx
// Botão flutuante (canto inferior direito) que abre o chat do Tutti.

import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { TuttiChatModal } from './TuttiChatModal';

const ICON = require('../../assets/tutti-peeking.png');

export function TuttiFAB({ bottomOffset = 88 }) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <View
        style={[s.fabWrapper, { bottom: bottomOffset }]}
        pointerEvents="box-none"
      >
        <View style={s.fabShadow}>
          <TouchableOpacity
            style={s.fab}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
            accessibilityLabel="Abrir Tutti, assistente de IA"
            accessibilityRole="button"
            accessibilityHint="Toque para receber recomendações personalizadas do cardápio"
          >
            <Image source={ICON} style={s.icon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <TuttiChatModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    elevation: 10,
  },
  // Wrapper da sombra (sem overflow pra sombra renderizar fora do círculo)
  fabShadow: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: '#D6E9F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  fab: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    // Imagem top-aligned: como o Tutti está no centro do PNG, ele acaba na
    // parte inferior do círculo com o corpo extrapolando (clipado)
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  icon: {
    width: 120,
    height: 120,
    marginTop: -3, // sobe um pouco o Tutti dentro do círculo
  },
});
