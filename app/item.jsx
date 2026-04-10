import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ItemImage } from '../components/ItemImage';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/theme';

export default function ItemDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addItem } = useCart();
  const { theme } = useTheme();
  const [observacao, setObservacao] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  const price = parseFloat(params.price || 0);
  const total = price * quantidade;

  const handleAddToCart = () => {
    const item = {
      id: params.id,
      name: params.name,
      price: price,
      image: params.image,
      description: params.description,
      observacao: observacao.trim() || null,
      quantity: quantidade,
    };

    for (let i = 0; i < quantidade; i++) {
      addItem(item);
    }
    router.push('/cart');
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      {/* Header com imagem */}
      <View style={[s.imageSection, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.push('/menu')}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        {params.image && params.image.startsWith('http') ? (
          <Image source={{ uri: params.image }} style={s.itemImage} resizeMode="cover" />
        ) : (
          <ItemImage image={params.image} size={100} />
        )}
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Info */}
        <Text style={[s.name, { color: theme.text }]}>{params.name}</Text>
        {params.description ? (
          <Text style={[s.description, { color: theme.textSecondary }]}>{params.description}</Text>
        ) : null}
        <Text style={s.price}>R$ {price.toFixed(2)}</Text>

        {/* Quantidade */}
        <View style={[s.quantityCard, { backgroundColor: theme.surface, borderColor: colors.border }]}>
          <Text style={[s.quantityLabel, { color: theme.text }]}>Quantidade</Text>
          <View style={s.quantityRow}>
            <TouchableOpacity
              style={[s.quantityBtn, { backgroundColor: colors.orange }]}
              onPress={() => setQuantidade(Math.max(1, quantidade - 1))}
            >
              <Ionicons name="remove" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[s.quantityText, { color: theme.text }]}>{quantidade}</Text>
            <TouchableOpacity
              style={[s.quantityBtn, { backgroundColor: colors.orange }]}
              onPress={() => setQuantidade(quantidade + 1)}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Observação */}
        <View style={[s.obsCard, { backgroundColor: theme.surface, borderColor: colors.border }]}>
          <Text style={[s.obsLabel, { color: theme.text }]}>Observação (opcional)</Text>
          <TextInput
            style={[s.obsInput, { backgroundColor: theme.background, color: theme.text, borderColor: colors.border }]}
            placeholder="Ex: sem cebola, bem passado, etc."
            placeholderTextColor={colors.textMuted}
            value={observacao}
            onChangeText={setObservacao}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Footer fixo */}
      <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[s.totalLabel, { color: theme.textSecondary }]}>Total</Text>
          <Text style={s.totalPrice}>R$ {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
          <Text style={s.addBtnText}>  Adicionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  imageSection: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 60, paddingBottom: 24,
  },
  backBtn: {
    position: 'absolute', top: 50, left: 16, padding: 8,
    zIndex: 1,
  },
  itemImage: {
    width: 180, height: 180, borderRadius: 16,
  },
  content: { padding: 20, gap: 16 },
  name: { fontSize: 22, fontWeight: '800' },
  description: { fontSize: 14, lineHeight: 20 },
  price: { fontSize: 24, fontWeight: '700', color: colors.orange },

  quantityCard: {
    borderRadius: 12, borderWidth: 1, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  quantityLabel: { fontSize: 15, fontWeight: '600' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  quantityBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  quantityText: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },

  obsCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  obsLabel: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  obsInput: {
    borderRadius: 10, padding: 12, fontSize: 14,
    minHeight: 70, textAlignVertical: 'top', borderWidth: 1,
  },

  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderTopWidth: 1,
  },
  totalLabel: { fontSize: 12 },
  totalPrice: { fontSize: 20, fontWeight: '800', color: colors.orange },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.orange, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
