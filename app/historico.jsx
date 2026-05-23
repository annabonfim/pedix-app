// app/historico.jsx
// Tela de histórico de pedidos — útil pra gerente/garçom (gestão).
//
// Cliente vê os pedidos dele em /orders (mais focado), então essa tela ficou
// dedicada ao ponto de vista do staff: lista todos os pedidos recentes
// com status atual, mesa, item count e total. Útil pra auditoria visual
// rápida de "o que rolou hoje".
//
// Antes essa tela puxava dados do `/historicos-pedidos` na API Java, mas o
// pedidoId lá ficou órfão depois que a gente migrou pedidos pro .NET (Guid).
// Reescrita pra consumir useAllPedidos do .NET, que é a fonte da verdade
// atual.

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAllPedidos } from '../hooks/usePedidos';
import { useMenuItems } from '../hooks/useMenuItems';
import { useMesas } from '../hooks/useMesas';
import { formatPedidoDate, translateStatus } from '../utils/time';
import { colors, shared } from '../styles/theme';

const STATUS_COLOR = {
  ABERTO:     '#F59E0B',
  PENDENTE:   '#F59E0B',
  EM_PREPARO: '#17A2B8',
  PRONTO:     '#28A745',
  ENTREGUE:   '#6C757D',
  CANCELADO:  '#DC3545',
};

function StatusPill({ status, theme }) {
  const upper = (status || '').toUpperCase();
  const color = STATUS_COLOR[upper] || theme.textSecondary;
  return (
    <View style={[s.pill, { borderColor: color, backgroundColor: `${color}20` }]}>
      <Text style={[s.pillText, { color }]}>{translateStatus(upper) || upper}</Text>
    </View>
  );
}

export default function HistoricoScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isAdmin, isGerente } = useAuth();

  const { data: pedidos = [], isLoading, isFetching, refetch } = useAllPedidos();
  const { data: menuItems = [] } = useMenuItems();
  const { data: mesas = [] } = useMesas();

  // Lookup pra mostrar nome do item em vez do ID
  const itemNameById = menuItems.reduce((acc, it) => {
    acc[it.id] = it.name;
    return acc;
  }, {});

  // Lookup pra mostrar número da mesa em vez do Guid
  const mesaNumeroById = mesas.reduce((acc, m) => {
    acc[m.id] = m.numero;
    return acc;
  }, {});

  // Pedidos ordenados por data desc (mais recente em cima)
  const pedidosOrdenados = [...pedidos].sort(
    (a, b) => new Date(b.dataPedido || 0) - new Date(a.dataPedido || 0)
  );

  // Acesso restrito: cliente não deve cair aqui pelo menu, mas se acessar
  // via deep link / URL, mostra mensagem clara em vez de dados de gestão.
  if (!isAdmin && !isGerente) {
    return (
      <View style={[shared.screen, { backgroundColor: theme.background }]}>
        <View style={[s.header, { backgroundColor: colors.navy }]}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={shared.headerTitle}>Histórico</Text>
            <View style={s.iconBtn} />
          </View>
        </View>
        <View style={s.center}>
          <Ionicons name="lock-closed-outline" size={56} color={colors.textMuted} />
          <Text style={[s.empty, { color: theme.text }]}>Acesso restrito</Text>
          <Text style={[s.muted, { color: theme.textSecondary }]}>
            Esta tela é exclusiva pra gerentes e garçons. Pra ver seus pedidos, use a aba "Pedidos".
          </Text>
        </View>
      </View>
    );
  }

  const formatItensResumo = (itens) => {
    if (!itens?.length) return 'Sem itens';
    return itens
      .slice(0, 2)
      .map((it) => {
        const nome = itemNameById[it.itemCardapioId] || `Item ${it.itemCardapioId}`;
        return `${it.quantidade || 1}x ${nome}`;
      })
      .join(', ') + (itens.length > 2 ? ` +${itens.length - 2}` : '');
  };

  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={shared.headerTitle}>Histórico</Text>
            <Text style={s.subtitle}>
              {pedidosOrdenados.length} {pedidosOrdenados.length === 1 ? 'pedido' : 'pedidos'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => refetch()} style={s.iconBtn}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : pedidosOrdenados.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="receipt-outline" size={56} color={colors.textMuted} />
          <Text style={[s.empty, { color: theme.text }]}>Nenhum pedido ainda</Text>
          <Text style={[s.muted, { color: theme.textSecondary }]}>
            Os pedidos aparecem aqui assim que os clientes começarem a fazer.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.orange}
            />
          }
        >
          {pedidosOrdenados.map((pedido) => {
            const shortId = String(pedido.id).slice(-4).toUpperCase();
            const mesaNumero = mesaNumeroById[pedido.mesaId] || '?';
            const total = pedido.itens?.reduce(
              (sum, it) => sum + parseFloat(it.subtotal || (it.precoUnitario * (it.quantidade || 1)) || 0),
              0
            ) || 0;
            return (
              <View
                key={pedido.id}
                style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}
              >
                <View style={s.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: theme.text }]}>
                      Pedido #{shortId}
                    </Text>
                    <Text style={[s.cardMeta, { color: theme.textSecondary }]}>
                      Mesa {mesaNumero} · {formatPedidoDate(pedido.dataPedido)}
                    </Text>
                  </View>
                  <StatusPill status={pedido.status} theme={theme} />
                </View>

                <Text style={[s.cardItens, { color: theme.textSecondary }]} numberOfLines={2}>
                  {formatItensResumo(pedido.itens)}
                </Text>

                <View style={[s.cardFooter, { borderTopColor: colors.border }]}>
                  <Text style={[s.cardFooterLabel, { color: theme.textSecondary }]}>
                    Total
                  </Text>
                  <Text style={[s.cardFooterValue, { color: theme.primary }]}>
                    R$ {total.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { padding: 4, width: 30 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  empty: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  muted: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  list: { padding: 14, gap: 10, paddingBottom: 32 },

  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 11, marginTop: 2 },
  cardItens: { fontSize: 13, lineHeight: 18 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  cardFooterLabel: { fontSize: 12, fontWeight: '600' },
  cardFooterValue: { fontSize: 16, fontWeight: '800' },

  pill: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    flexShrink: 0,
  },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});
