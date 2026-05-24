// app/gerente/relatorios.jsx
// Lista de relatórios administrativos (apenas Gerente)
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRelatorios } from '../../hooks/useRelatorios';
import { colors, shared } from '../../styles/theme';
import { TuttiLoading } from '../../components/Tutti/TuttiLoading';
import { parseAsUtc } from '../../utils/time';

const TIPO_ICON = {
  VENDAS: 'trending-up',
  PEDIDOS: 'receipt',
  CARDAPIO: 'restaurant',
  AVALIACOES: 'star',
};

function formatDate(iso) {
  if (!iso) return '';
  try {
    // dataGeracao vem da API Java sem 'Z' → parseAsUtc evita offset de -3h.
    return parseAsUtc(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function RelatoriosScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: relatorios = [], isLoading, refetch, isFetching } = useRelatorios();

  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={shared.headerTitle}>Relatórios</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.backBtn}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <TuttiLoading size="large" message="Carregando relatórios..." />
        </View>
      ) : relatorios.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="document-text-outline" size={56} color={colors.textMuted} />
          <Text style={[s.empty, { color: theme.text }]}>Nenhum relatório encontrado</Text>
          <Text style={[s.muted, { color: theme.textSecondary }]}>
            Os relatórios aparecerão aqui assim que forem gerados pelo sistema.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {relatorios.map((r) => (
            <View
              key={r.id}
              style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}
            >
              <View style={[s.iconBox, { backgroundColor: theme.background }]}>
                <Ionicons
                  name={TIPO_ICON[r.tipo] || 'document-text'}
                  size={20}
                  color={colors.orange}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>
                  {r.titulo}
                </Text>
                {r.descricao ? (
                  <Text style={[s.desc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {r.descricao}
                  </Text>
                ) : null}
                <View style={s.row}>
                  {r.tipo ? (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{r.tipo}</Text>
                    </View>
                  ) : null}
                  {r.dataGeracao ? (
                    <Text style={[s.date, { color: theme.textSecondary }]}>
                      {formatDate(r.dataGeracao)}
                    </Text>
                  ) : null}
                </View>
                <View style={s.metricsRow}>
                  {r.valorTotal > 0 && (
                    <View style={s.metric}>
                      <Text style={[s.metricLabel, { color: theme.textSecondary }]}>Total</Text>
                      <Text style={[s.metricValue, { color: colors.orange }]}>
                        R$ {r.valorTotal.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {r.quantidade > 0 && (
                    <View style={s.metric}>
                      <Text style={[s.metricLabel, { color: theme.textSecondary }]}>Qtd</Text>
                      <Text style={[s.metricValue, { color: theme.text }]}>{r.quantidade}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
          {isFetching && (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.orange} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  empty: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  muted: { fontSize: 13, textAlign: 'center' },

  list: { padding: 14, gap: 10 },

  card: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 14, gap: 12,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge: {
    backgroundColor: '#1E3A5F22', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.navy, letterSpacing: 0.5 },
  date: { fontSize: 11 },

  metricsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  metric: { gap: 2 },
  metricLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { fontSize: 14, fontWeight: '700' },
});
