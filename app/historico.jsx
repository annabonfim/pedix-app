// app/historico.jsx
// Tela de histórico de mudanças de status dos pedidos
// Cliente vê os pedidos da sua mesa, gerente/garçom vê tudo
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useHistoricos } from '../hooks/useHistoricos';
import { translateStatus } from '../utils/time';
import { colors, shared } from '../styles/theme';

const STATUS_COLOR = {
  EM_PREPARO: '#F4B400',
  PRONTO: '#4285F4',
  ENTREGUE: '#28A745',
  CANCELADO: '#E53935',
};

function formatDateTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusPill({ status, theme }) {
  const color = STATUS_COLOR[status] || theme.textSecondary;
  return (
    <View style={[s.pill, { borderColor: color, backgroundColor: `${color}20` }]}>
      <Text style={[s.pillText, { color }]}>{translateStatus(status) || status}</Text>
    </View>
  );
}

export default function HistoricoScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: historicos = [], isLoading, refetch } = useHistoricos();

  // Agrupa por pedido pra exibição
  const grouped = historicos.reduce((acc, h) => {
    const id = h.pedidoId;
    if (!acc[id]) acc[id] = [];
    acc[id].push(h);
    return acc;
  }, {});

  const grupos = Object.entries(grouped)
    .map(([pedidoId, registros]) => ({
      pedidoId,
      registros: [...registros].sort(
        (a, b) => new Date(b.dataRegistro || 0) - new Date(a.dataRegistro || 0)
      ),
    }))
    .sort((a, b) => Number(b.pedidoId) - Number(a.pedidoId));

  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={shared.headerTitle}>Histórico</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.iconBtn}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : grupos.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="time-outline" size={56} color={colors.textMuted} />
          <Text style={[s.empty, { color: theme.text }]}>Nenhum histórico ainda</Text>
          <Text style={[s.muted, { color: theme.textSecondary }]}>
            Os registros aparecem conforme os pedidos mudam de status.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {grupos.map((grupo) => (
            <View
              key={grupo.pedidoId}
              style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}
            >
              <Text style={[s.cardTitle, { color: theme.text }]}>
                Pedido #{grupo.pedidoId}
              </Text>
              <View style={s.timeline}>
                {grupo.registros.map((r, idx) => (
                  <View key={r.id} style={s.timelineItem}>
                    <View style={s.timelineLeft}>
                      <View style={[s.timelineDot, { backgroundColor: STATUS_COLOR[r.statusNovo] || colors.orange }]} />
                      {idx < grupo.registros.length - 1 && (
                        <View style={[s.timelineLine, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                    <View style={{ flex: 1, paddingBottom: idx < grupo.registros.length - 1 ? 14 : 0 }}>
                      <View style={s.statusRow}>
                        {r.statusAnterior ? (
                          <>
                            <StatusPill status={r.statusAnterior} theme={theme} />
                            <Ionicons name="arrow-forward" size={12} color={theme.textSecondary} />
                          </>
                        ) : null}
                        <StatusPill status={r.statusNovo} theme={theme} />
                      </View>
                      {r.descricao ? (
                        <Text style={[s.entryDesc, { color: theme.textSecondary }]}>
                          {r.descricao}
                        </Text>
                      ) : null}
                      <View style={s.metaRow}>
                        {r.usuario ? (
                          <Text style={[s.meta, { color: theme.textSecondary }]}>
                            por {r.usuario}
                          </Text>
                        ) : null}
                        <Text style={[s.meta, { color: theme.textSecondary }]}>
                          {formatDateTime(r.dataRegistro)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
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
  iconBtn: { padding: 4 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  empty: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  muted: { fontSize: 13, textAlign: 'center' },

  list: { padding: 14, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },

  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 10 },
  timelineLeft: { width: 14, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { flex: 1, width: 2, marginTop: 2 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  pill: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  entryDesc: { fontSize: 12, marginTop: 6, lineHeight: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  meta: { fontSize: 10 },
});
