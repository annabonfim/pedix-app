// app/avaliacoes.jsx
// Lista de avaliações dos clientes (visível para Gerente e Cliente)
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAvaliacoes, useDeleteAvaliacao } from '../hooks/useAvaliacoes';
import { colors, shared } from '../styles/theme';
import { TuttiLoading } from '../components/Tutti/TuttiLoading';
import { parseAsUtc } from '../utils/time';

function formatDate(iso) {
  if (!iso) return '';
  try {
    // API Java retorna dataAvaliacao sem 'Z'. parseAsUtc trata como UTC
    // pra não gerar offset de -3h no Brasil (mostraria "dia anterior").
    return parseAsUtc(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function Stars({ nota }) {
  const total = 5;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < nota ? 'star' : 'star-outline'}
          size={14}
          color={i < nota ? '#F4B400' : colors.textMuted}
        />
      ))}
    </View>
  );
}

export default function AvaliacoesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isGerente } = useAuth();
  const { data: avaliacoes = [], isLoading, refetch } = useAvaliacoes();
  const deleteMutation = useDeleteAvaliacao();

  const handleDelete = (avaliacao) => {
    Alert.alert(
      'Remover avaliação',
      `Deseja remover a avaliação de ${avaliacao.nomeCliente}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(avaliacao.id);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={shared.headerTitle}>Avaliações</Text>
          <TouchableOpacity onPress={() => router.push('/avaliacao-form')} style={s.backBtn}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <TuttiLoading size="large" message="Carregando avaliações..." />
        </View>
      ) : avaliacoes.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="star-outline" size={56} color={colors.textMuted} />
          <Text style={[s.empty, { color: theme.text }]}>Sem avaliações ainda</Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => router.push('/avaliacao-form')}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={s.emptyBtnText}>Avaliar um item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {avaliacoes.map((a) => (
            <View
              key={a.id}
              style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}
            >
              <View style={s.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: theme.text }]}>{a.nomeCliente || 'Cliente'}</Text>
                  <Stars nota={a.nota} />
                </View>
                {isGerente && (
                  <TouchableOpacity onPress={() => handleDelete(a)} style={s.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color="#E53935" />
                  </TouchableOpacity>
                )}
              </View>
              {a.comentario ? (
                <Text style={[s.comment, { color: theme.textSecondary }]}>"{a.comentario}"</Text>
              ) : null}
              <View style={s.cardFooter}>
                {a.itemCardapioId ? (
                  <Text style={[s.meta, { color: theme.textSecondary }]}>
                    Item #{a.itemCardapioId}
                  </Text>
                ) : null}
                {a.dataAvaliacao ? (
                  <Text style={[s.meta, { color: theme.textSecondary }]}>
                    {formatDate(a.dataAvaliacao)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  empty: { fontSize: 16, fontWeight: '700' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.orange, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  list: { padding: 14, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  deleteBtn: { padding: 6 },
  comment: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  meta: { fontSize: 11 },
});
