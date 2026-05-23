// app/admin/mesa-pedidos.jsx
// Tela exclusiva do GARÇOM/ADMIN
// Mostra todos os pedidos de uma mesa específica e permite atualizar status

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { usePedidosByMesa, useAtualizarStatus } from '../../hooks/usePedidos';
import { useMenuItems } from '../../hooks/useMenuItems';
import { formatPedidoDate, translateStatus } from '../../utils/time';
import { colors } from '../../styles/theme';

// ─── STATUS FLOW ─────────────────────────────────────────────────────────────
// O garçom/admin pode avançar o status nessa sequência:
// ABERTO → EM_PREPARO → PRONTO → ENTREGUE
const STATUS_FLOW = ['ABERTO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE'];

const STATUS_CONFIG = {
  ABERTO:     { color: '#F59E0B', bg: '#FEF3C7', label: 'Aberto',     icon: 'time-outline'              },
  PENDENTE:   { color: '#F59E0B', bg: '#FEF3C7', label: 'Pendente',   icon: 'time-outline'              },
  EM_PREPARO: { color: '#17A2B8', bg: '#D1ECF1', label: 'Em Preparo', icon: 'flame-outline'             },
  PRONTO:     { color: '#28A745', bg: '#D4EDDA', label: 'Pronto',     icon: 'checkmark-circle-outline'  },
  ENTREGUE:   { color: '#6C757D', bg: '#E2E3E5', label: 'Entregue',   icon: 'bag-check-outline'         },
  CANCELADO:  { color: '#DC3545', bg: '#F8D7DA', label: 'Cancelado',  icon: 'close-circle-outline'      },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[(status || '').toUpperCase()] || STATUS_CONFIG.ABERTO;
}

function getNextStatus(current) {
  const normalized = (current || '').toUpperCase();
  // PENDENTE é alias de ABERTO — trata igual
  const start = normalized === 'PENDENTE' ? 'ABERTO' : normalized;
  const idx = STATUS_FLOW.indexOf(start);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function AdminMesaPedidosScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { mesaId, mesaNumero, mesaStatus } = useLocalSearchParams();

  const {
    data: pedidos = [],
    isLoading,
    isFetching,
    refetch,
  } = usePedidosByMesa(mesaId);

  const atualizarStatusMutation = useAtualizarStatus();

  // Lookup itemCardapioId → nome (a C# guarda só ID; nome vem do cardápio Java)
  const { data: menuItems = [] } = useMenuItems();
  const itemNameById = menuItems.reduce((acc, it) => {
    acc[it.id] = it.name;
    return acc;
  }, {});

  const s = makeStyles(theme);

  // Ordena: mais urgentes primeiro (ABERTO/PENDENTE no topo)
  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    const priority = { ABERTO: 0, PENDENTE: 0, EM_PREPARO: 1, PRONTO: 2, ENTREGUE: 3, CANCELADO: 4 };
    const pA = priority[(a.status || '').toUpperCase()] ?? 5;
    const pB = priority[(b.status || '').toUpperCase()] ?? 5;
    return pA - pB;
  });

  const handleAvancarStatus = (pedido) => {
    const proximo = getNextStatus(pedido.status);
    if (!proximo) return;

    const cfg = getStatusConfig(proximo);
    Alert.alert(
      'Atualizar status',
      `Marcar pedido #${pedido.id} como "${cfg.label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: cfg.label,
          onPress: () => {
            atualizarStatusMutation.mutate(
              { pedidoId: pedido.id, status: proximo },
              {
                onSuccess: () => {
                  // TanStack Query invalida e re-fetcha automaticamente
                },
                onError: () =>
                  Alert.alert('Erro', 'Não foi possível atualizar o status.'),
              }
            );
          },
        },
      ]
    );
  };

  const formatItens = (itens) => {
    if (!itens?.length) return 'Sem itens';
    return itens
      .map((item) => {
        const nome =
          item.itemCardapio?.nome ||
          item.itemCardapio?.name ||
          itemNameById[item.itemCardapioId] ||
          `Item ${item.itemCardapioId}`;
        return `${item.quantidade || 1}x ${nome}`;
      })
      .join('\n');
  };

  if (isLoading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.push('/admin/mesas')} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>Mesa {mesaNumero}</Text>
          <Text style={s.headerSub}>{pedidosOrdenados.length} pedido(s)</Text>
        </View>
        <TouchableOpacity onPress={refetch} style={s.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color={theme.headerText} />
        </TouchableOpacity>
      </View>

      {/* Pipeline de status (visual rápido) */}
      <View style={s.pipeline}>
        {STATUS_FLOW.map((st, i) => {
          const count = pedidos.filter((p) => (p.status || '').toUpperCase() === st).length;
          const cfg = getStatusConfig(st);
          return (
            <View key={st} style={s.pipelineItem}>
              <View style={[s.pipelineBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[s.pipelineCount, { color: cfg.color }]}>{count}</Text>
              </View>
              <Text style={[s.pipelineLabel, { color: theme.textSecondary }]}>{cfg.label}</Text>
              {i < STATUS_FLOW.length - 1 && (
                <Ionicons name="chevron-forward" size={14} color={theme.textMuted} style={s.pipelineArrow} />
              )}
            </View>
          );
        })}
      </View>

      {/* Lista de pedidos */}
      <ScrollView
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        {pedidosOrdenados.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="receipt-outline" size={56} color={theme.textMuted} />
            <Text style={[s.emptyText, { color: theme.text }]}>Nenhum pedido nessa mesa</Text>
            <Text style={[s.emptySubtext, { color: theme.textSecondary }]}>
              Os pedidos aparecem aqui assim que forem feitos.
            </Text>
          </View>
        ) : (
          pedidosOrdenados.map((pedido) => {
            const cfg = getStatusConfig(pedido.status);
            const proximo = getNextStatus(pedido.status);
            const proxCfg = proximo ? getStatusConfig(proximo) : null;
            const isCancelado = (pedido.status || '').toUpperCase() === 'CANCELADO';
            const isEntregue = (pedido.status || '').toUpperCase() === 'ENTREGUE';

            return (
              <View key={pedido.id} style={[s.pedidoCard, { backgroundColor: theme.card }]}>
                {/* Cabeçalho do pedido */}
                <View style={s.pedidoHeader}>
                  <View>
                    <Text style={[s.pedidoId, { color: theme.text }]} numberOfLines={1}>
                      Pedido #{String(pedido.id).slice(-4).toUpperCase()}
                    </Text>
                    <Text style={[s.pedidoDate, { color: theme.textSecondary }]}>
                      {formatPedidoDate(pedido.dataCriacao)}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                    <Text style={[s.statusText, { color: cfg.color }]}> {cfg.label}</Text>
                  </View>
                </View>

                {/* Itens */}
                <View style={[s.itensContainer, { backgroundColor: theme.background }]}>
                  <Text style={[s.itensText, { color: theme.text }]}>
                    {formatItens(pedido.itens)}
                  </Text>
                </View>

                {/* Observação */}
                {pedido.observacao ? (
                  <View style={s.obsRow}>
                    <Ionicons name="chatbubble-outline" size={13} color={theme.textSecondary} />
                    <Text style={[s.obsText, { color: theme.textSecondary }]}>
                      {' '}{pedido.observacao}
                    </Text>
                  </View>
                ) : null}

                {/* Ação principal: avançar status */}
                {!isCancelado && !isEntregue && proximo && proxCfg && (
                  <TouchableOpacity
                    style={[
                      s.actionBtn,
                      { backgroundColor: proxCfg.color },
                      atualizarStatusMutation.isPending && { opacity: 0.6 },
                    ]}
                    onPress={() => handleAvancarStatus(pedido)}
                    disabled={atualizarStatusMutation.isPending}
                  >
                    <Ionicons name={proxCfg.icon} size={16} color="#FFFFFF" />
                    <Text style={s.actionBtnText}>  Marcar como {proxCfg.label}</Text>
                  </TouchableOpacity>
                )}

                {/* Entregue — estado final */}
                {isEntregue && (
                  <View style={s.finalState}>
                    <Ionicons name="checkmark-done-circle-outline" size={16} color="#6C757D" />
                    <Text style={[s.finalText, { color: theme.textSecondary }]}> Pedido entregue</Text>
                  </View>
                )}

                {/* Cancelado */}
                {isCancelado && (
                  <View style={s.finalState}>
                    <Ionicons name="close-circle-outline" size={16} color="#DC3545" />
                    <Text style={{ fontSize: 13, color: '#DC3545' }}> Pedido cancelado</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
      backgroundColor: theme.header,
      paddingTop: 52,
      paddingBottom: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
    },
    backBtn: { padding: 4 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: theme.headerText },
    headerSub: { fontSize: 13, color: theme.headerText, opacity: 0.75 },
    refreshBtn: { padding: 4 },
    pipeline: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    pipelineItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pipelineBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pipelineCount: { fontSize: 13, fontWeight: '700' },
    pipelineLabel: { fontSize: 11 },
    pipelineArrow: { marginHorizontal: 2 },
    list: { padding: 12, gap: 12 },
    pedidoCard: {
      borderRadius: 12,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 2,
    },
    pedidoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    pedidoId: { fontSize: 16, fontWeight: '700' },
    pedidoDate: { fontSize: 12, marginTop: 2 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    statusText: { fontSize: 12, fontWeight: '600' },
    itensContainer: {
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
    },
    itensText: { fontSize: 14, lineHeight: 22 },
    obsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    obsText: { fontSize: 13, fontStyle: 'italic', flex: 1 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      paddingVertical: 12,
      marginTop: 4,
    },
    actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    finalState: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
    },
    finalText: { fontSize: 13 },
    loadingText: { marginTop: 12, fontSize: 15, color: theme.textSecondary },
    emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyText: { fontSize: 17, fontWeight: '600' },
    emptySubtext: { fontSize: 14, textAlign: 'center', maxWidth: 260 },
  });
}