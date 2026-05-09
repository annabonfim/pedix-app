// app/avaliacao-form.jsx
// Tela de criar nova avaliação (qualquer usuário autenticado)
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCreateAvaliacao } from '../hooks/useAvaliacoes';
import { colors, shared } from '../styles/theme';

export default function AvaliacaoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [itemId, setItemId] = useState(params.itemId ? String(params.itemId) : '');
  const [pedidoId, setPedidoId] = useState(params.pedidoId ? String(params.pedidoId) : '');

  const createMutation = useCreateAvaliacao();

  const handleSave = async () => {
    if (!nota || nota < 1 || nota > 5) {
      Alert.alert('Avaliação inválida', 'Selecione uma nota de 1 a 5 estrelas.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        pedidoId: pedidoId ? parseInt(pedidoId, 10) : null,
        itemCardapioId: itemId ? parseInt(itemId, 10) : null,
        nomeCliente: user?.nome || 'Anônimo',
        nota,
        comentario: comentario.trim(),
      });
      Alert.alert('Obrigado!', 'Sua avaliação foi registrada.');
      router.replace('/avaliacoes');
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível enviar a avaliação.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[shared.screen, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={shared.headerTitle}>Nova Avaliação</Text>
          <View style={{ width: 30 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        <Text style={[s.label, { color: theme.textSecondary }]}>Nota</Text>
        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setNota(n)} style={s.starBtn}>
              <Ionicons
                name={n <= nota ? 'star' : 'star-outline'}
                size={36}
                color={n <= nota ? '#F4B400' : colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.label, { color: theme.textSecondary }]}>Item do cardápio (opcional)</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.surface, color: theme.text, borderColor: colors.border }]}
          placeholder="ID do item"
          placeholderTextColor={colors.textMuted}
          value={itemId}
          onChangeText={setItemId}
          keyboardType="number-pad"
        />

        <Text style={[s.label, { color: theme.textSecondary }]}>Pedido (opcional)</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.surface, color: theme.text, borderColor: colors.border }]}
          placeholder="ID do pedido"
          placeholderTextColor={colors.textMuted}
          value={pedidoId}
          onChangeText={setPedidoId}
          keyboardType="number-pad"
        />

        <Text style={[s.label, { color: theme.textSecondary }]}>Comentário</Text>
        <TextInput
          style={[s.input, s.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: colors.border }]}
          placeholder="Conte como foi a experiência..."
          placeholderTextColor={colors.textMuted}
          value={comentario}
          onChangeText={setComentario}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[s.submitBtn, createMutation.isPending && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={s.submitText}>Enviar avaliação</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },

  form: { padding: 20, gap: 4, paddingBottom: 40 },

  label: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 6 },

  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 8 },
  starBtn: { padding: 4 },

  input: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14,
    height: 48, fontSize: 15,
  },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },

  submitBtn: {
    backgroundColor: colors.orange, borderRadius: 12, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24, gap: 8,
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
