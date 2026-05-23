import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useMeusPedidos, useDeletarPedido } from '../hooks/usePedidos';
import { useMenuItems } from '../hooks/useMenuItems';
import { usePedidoStatusNotifications } from '../hooks/usePedidoStatusNotifications';
import { TuttiLoading } from '../components/Tutti/TuttiLoading';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { APP_CONFIG } from '../config/constants';
import { canEditPedido, formatPedidoDate, getTimeRemaining, translateStatus } from '../utils/time';
import { useEffect, useState } from 'react';

export default function OrdersScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [tableNumber, setTableNumber] = useState(null);

  // Carrega o número da mesa do AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER).then((val) => {
      if (val) setTableNumber(parseInt(val, 10));
    });
  }, []);

  // ─── TanStack Query ──────────────────────────────────────────────────────
  const {
    data: pedidos = [],
    isLoading,
    isFetching,
    refetch,
  } = useMeusPedidos();

  const deletarMutation = useDeletarPedido();

  // Dispara notificação local quando o status de algum pedido muda
  usePedidoStatusNotifications(pedidos);

  // Mapa itemCardapioId → nome (pra mostrar nomes em vez de "Item #1")
  // A C# guarda só o ID do cardápio; o nome vem do cardápio Java.
  const { data: menuItems = [] } = useMenuItems();
  const itemNameById = menuItems.reduce((acc, it) => {
    acc[it.id] = it.name;
    return acc;
  }, {});

  // Ordena por mais recente
  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    const dA = new Date(a.dataCriacao || 0);
    const dB = new Date(b.dataCriacao || 0);
    return dB - dA;
  });

  // Essa tela mostra só a comanda em aberto. Pedidos finalizados/cancelados
  // ficam em /historico (atalho na home).
  // ABERTO / EM_PREPARO / PRONTO / ENTREGUE = ainda em curso (ENTREGUE
  // significa "comida na mesa, conta em aberto" — cliente ainda paga).
  // FINALIZADO / CANCELADO = terminais (saem desta tela).
  const STATUS_TERMINAIS = new Set(['FINALIZADO', 'CANCELADO']);
  const pedidosAtuais = pedidosOrdenados.filter(
    (p) => !STATUS_TERMINAIS.has((p.status || '').toUpperCase())
  );

  // Total da conta = soma dos pedidos ainda pagáveis (não terminais).
  const totalConta = pedidosAtuais.reduce(
    (sum, p) => sum + (p.total ? parseFloat(p.total) : 0),
    0
  );

  // ─── ACTIONS ─────────────────────────────────────────────────────────────
  const handleEditPedido = (pedido) => {
    if (!canEditPedido(pedido, 5)) {
      Alert.alert('Tempo Esgotado', 'Só é possível editar pedidos nos primeiros 5 minutos.');
      return;
    }
    router.push({ pathname: '/edit-order', params: { pedidoId: String(pedido.id), comandaId: String(tableNumber) } });
  };

  const handleCancelPedido = (pedido) => {
    if (!canEditPedido(pedido, 5)) {
      Alert.alert('Tempo Esgotado', 'Só é possível cancelar pedidos nos primeiros 5 minutos.');
      return;
    }
    Alert.alert('Cancelar Pedido', `Deseja cancelar o pedido #${pedido.id}?`, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        style: 'destructive',
        onPress: () => {
          deletarMutation.mutate(pedido.id, {
            onSuccess: () => Alert.alert('Sucesso', 'Pedido cancelado.'),
            onError: () => Alert.alert('Erro', 'Não foi possível cancelar.'),
          });
        },
      },
    ]);
  };

  // ─── HELPERS ─────────────────────────────────────────────────────────────
  const formatItens = (itens) => {
    if (!itens?.length) return 'Sem itens';
    return itens
      .map((item) => {
        const nome =
          item.nome ||
          item.itemCardapio?.nome ||
          item.itemCardapio?.name ||
          itemNameById[item.itemCardapioId] ||
          `Item #${item.itemCardapioId}`;
        return `${item.quantidade || 1}x ${nome}`;
      })
      .join(', ');
  };

  const calculateTotal = (pedido) => {
    // A API já retorna o total calculado
    if (pedido.total) return parseFloat(pedido.total);
    // Fallback: soma subtotais dos itens
    if (!pedido.itens?.length) return 0;
    return pedido.itens.reduce((sum, item) => {
      return sum + parseFloat(item.subtotal || item.precoUnitario * (item.quantidade || 1) || 0);
    }, 0);
  };

  // ─── STYLES ──────────────────────────────────────────────────────────────
  const s = makeStyles(theme);

  if (isLoading) {
    return (
      <View style={[s.container, s.center]}>
        <TuttiLoading size="large" message="Buscando seus pedidos..." />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Meus Pedidos</Text>
          {tableNumber && <Text style={s.headerSubtitle}>Mesa {tableNumber}</Text>}
          {isAdmin && (
            <View style={s.adminBadge}>
              <Ionicons name="shield-checkmark-outline" size={12} color="#FFFFFF" />
              <Text style={s.adminText}> Admin</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={toggleTheme} style={{ padding: 8 }}>
          <Ionicons
            name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={20} color={theme.headerText}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.content}
        contentContainerStyle={s.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        {pedidosAtuais.length === 0 ? (
          <Card>
            <View style={s.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={theme.textMuted} />
              <Text style={[s.emptyText, { color: theme.text }]}>Nenhum pedido em aberto</Text>
              <Text style={[s.emptySubtext, { color: theme.textSecondary }]}>
                Faça um pedido no cardápio ou veja o histórico.
              </Text>
              <Button title="Ver Cardápio" onPress={() => router.push('/menu')} />
            </View>
          </Card>
        ) : (
          <View>
            <Text style={s.sectionLabel}>Comanda atual</Text>
            {pedidosAtuais.map((pedido) => {
              const canEdit = canEditPedido(pedido, 5);
              const timeRemaining = canEdit
                ? getTimeRemaining(pedido.dataCriacao, 5)
                : null;
              const total = calculateTotal(pedido);
              const status = translateStatus(pedido.status);

              return (
                <View key={pedido.id} style={s.card}>
                  <View style={s.pedidoHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[s.pedidoId, { color: theme.text }]} numberOfLines={1}>
                        Pedido #{String(pedido.id).slice(-4).toUpperCase()}
                      </Text>
                      <Text style={[s.pedidoDate, { color: theme.textSecondary }]}>
                        {formatPedidoDate(pedido.dataCriacao)}
                      </Text>
                    </View>
                    <View style={[s.statusBadge, getStatusStyle(pedido.status)]}>
                      <Text
                        style={[s.statusText, { color: getStatusStyle(pedido.status).color }]}
                        numberOfLines={1}
                      >
                        {status}
                      </Text>
                    </View>
                  </View>

                  <Text style={[s.itensText, { color: theme.text }]}>
                    {formatItens(pedido.itens)}
                  </Text>

                  {pedido.observacao ? (
                    <Text style={[s.observacao, { color: theme.textSecondary }]}>
                      📝 {pedido.observacao}
                    </Text>
                  ) : null}

                  <Text style={[s.totalText, { color: theme.primary }]}>
                    Total: R$ {total.toFixed(2)}
                  </Text>

                  {canEdit && timeRemaining && (
                    <Text style={s.timeText}>⏱️ {timeRemaining}</Text>
                  )}

                  {canEdit && pedido.status !== 'CANCELADO' && (
                    <View style={s.actionsRow}>
                      <TouchableOpacity style={s.editBtn} onPress={() => handleEditPedido(pedido)}>
                        <Text style={s.btnText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancelPedido(pedido)}>
                        <Text style={s.btnText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Botão "Pagar conta" — só cliente, só se tiver algo pra pagar */}
      {!isAdmin && totalConta > 0 && (
        <View style={s.payFooter}>
          <TouchableOpacity
            style={s.payBtn}
            onPress={() => router.push('/pagamento')}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={20} color="#FFFFFF" />
            <Text style={s.payBtnText}>
              {'  Pagar conta · R$ '}
              {totalConta.toFixed(2).replace('.', ',')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getStatusStyle(status) {
  const map = {
    PENDENTE:   { backgroundColor: '#FFF3CD', borderColor: '#FFC107', color: '#856404' },
    ABERTO:     { backgroundColor: '#FFF3CD', borderColor: '#FFC107', color: '#856404' },
    PREPARANDO: { backgroundColor: '#D1ECF1', borderColor: '#17A2B8', color: '#0C5460' },
    EM_PREPARO: { backgroundColor: '#D1ECF1', borderColor: '#17A2B8', color: '#0C5460' },
    PRONTO:     { backgroundColor: '#D4EDDA', borderColor: '#28A745', color: '#155724' },
    ENTREGUE:   { backgroundColor: '#E2E3E5', borderColor: '#6C757D', color: '#383D41' },
    FINALIZADO: { backgroundColor: '#D1E7DD', borderColor: '#198754', color: '#0F5132' },
    CANCELADO:  { backgroundColor: '#F8D7DA', borderColor: '#DC3545', color: '#721C24' },
  };
  return map[status] || map.PENDENTE;
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
      padding: 16,
      paddingTop: 50,
      backgroundColor: theme.header,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    headerTitle: { fontSize: 24, fontWeight: '700', color: theme.headerText },
    headerSubtitle: { fontSize: 14, color: theme.headerText, opacity: 0.8, marginTop: 4 },
    adminBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,107,53,0.3)',
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginTop: 6,
    },
    adminText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
    content: { flex: 1 },
    payFooter: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderTopColor: theme.divider || '#E5E7EB',
      backgroundColor: theme.surface,
    },
    payBtn: {
      backgroundColor: '#FF6B35',
      borderRadius: 12,
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    payBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    contentContainer: { padding: 16, gap: 12 },
    loadingText: { marginTop: 16, fontSize: 16, color: theme.textSecondary },
    emptyContainer: { alignItems: 'center', padding: 32, gap: 8 },
    emptyText: { fontSize: 18, fontWeight: '600' },
    emptySubtext: { fontSize: 14, textAlign: 'center' },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: 10,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: 4,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    pedidoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    pedidoId: { fontSize: 16, fontWeight: '700' },
    pedidoDate: { fontSize: 13, marginTop: 2 },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    statusText: { fontSize: 12, fontWeight: '600' },
    itensText: { fontSize: 14, marginBottom: 6 },
    observacao: { fontSize: 13, fontStyle: 'italic', marginBottom: 6 },
    totalText: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
    timeText: { fontSize: 12, color: '#2E7D32', fontWeight: '600', marginBottom: 8 },
    actionsRow: { flexDirection: 'row', gap: 8 },
    editBtn: { flex: 1, backgroundColor: '#FF6B35', padding: 10, borderRadius: 10, alignItems: 'center' },
    cancelBtn: { flex: 1, backgroundColor: '#DC3545', padding: 10, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  });
}