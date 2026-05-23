// app/admin/mesas.jsx
// Tela exclusiva do GARÇOM/ADMIN
// Mostra todas as mesas com status e acesso aos pedidos de cada uma

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMesas } from '../../hooks/useMesas';
import { useAllPedidos } from '../../hooks/usePedidos';
import { useMenuItems } from '../../hooks/useMenuItems';
import { colors } from '../../styles/theme';

// ─── STATUS DA MESA ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  LIVRE:   { label: 'Livre',   color: '#28A745', bg: '#D4EDDA', icon: 'checkmark-circle-outline' },
  OCUPADA: { label: 'Ocupada', color: '#FF6B35', bg: '#FFE8DF', icon: 'people-outline'           },
};

function getStatusConfig(status) {
  const key = (status || '').toUpperCase();
  return STATUS_CONFIG[key] || STATUS_CONFIG.LIVRE;
}

export default function AdminMesasScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const { data: mesasRaw = [], isLoading, isFetching, refetch } = useMesas();
  const { data: pedidos = [] } = useAllPedidos();
  const { data: menuItems = [] } = useMenuItems();
  const mesas = [...mesasRaw].sort((a, b) => (a.numero || 0) - (b.numero || 0));

  const s = makeStyles(theme);

  // Lookup itemCardapioId → nome (nomes vêm do cardápio Java)
  const itemNameById = menuItems.reduce((acc, it) => {
    acc[it.id] = it.name;
    return acc;
  }, {});

  // Agrupa pedidos ativos por mesaId (ignora cancelado/entregue)
  const pedidosByMesa = pedidos.reduce((acc, p) => {
    const st = (p.status || '').toUpperCase();
    if (st === 'CANCELADO' || st === 'ENTREGUE') return acc;
    const mid = p.mesaId;
    if (!mid) return acc;
    if (!acc[mid]) acc[mid] = [];
    acc[mid].push(p);
    return acc;
  }, {});

  // Resumo da comanda de uma mesa: itens agregados + total
  const resumoComanda = (mesaId) => {
    const ps = pedidosByMesa[mesaId] || [];
    const itensMap = new Map();
    let total = 0;
    for (const p of ps) {
      for (const it of p.itens || []) {
        const nome =
          itemNameById[it.itemCardapioId] || `Item ${it.itemCardapioId}`;
        const q = it.quantidade || 1;
        const sub = parseFloat(it.subtotal || it.precoUnitario * q || 0);
        const prev = itensMap.get(nome) || { nome, q: 0 };
        prev.q += q;
        itensMap.set(nome, prev);
        total += sub;
      }
    }
    return {
      itens: Array.from(itensMap.values()),
      total,
      qtdPedidos: ps.length,
    };
  };

  // Status efetivo: API às vezes não atualiza pra OCUPADA quando cria pedido,
  // então se a mesa tem comanda ativa, força OCUPADA na visualização.
  const getStatusEfetivo = (mesa) => {
    const hasComanda = (pedidosByMesa[mesa.id] || []).length > 0;
    if (hasComanda) return 'OCUPADA';
    return (mesa.status || 'LIVRE').toUpperCase();
  };

  // Conta por status para o resumo no topo (usando status efetivo)
  const counts = mesas.reduce((acc, m) => {
    const key = getStatusEfetivo(m);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

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
        <View>
          <Text style={s.headerTitle}>Dashboard de Mesas</Text>
          <Text style={s.headerSub}>Olá, {user?.nome?.split(' ')[0]} 👋</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={toggleTheme} style={s.refreshBtn}>
            <Ionicons
              name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={20} color={theme.headerText}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={refetch} style={s.refreshBtn}>
            <Ionicons name="refresh-outline" size={22} color={theme.headerText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Resumo rápido */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={[s.summaryNumber, { color: '#28A745' }]}>{counts.LIVRE || 0}</Text>
          <Text style={s.summaryLabel}>Livres</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryNumber, { color: theme.primary }]}>{counts.OCUPADA || 0}</Text>
          <Text style={s.summaryLabel}>Ocupadas</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryNumber, { color: theme.text }]}>{mesas.length}</Text>
          <Text style={s.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Grid de mesas */}
      <ScrollView
        contentContainerStyle={s.grid}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        {mesas.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="grid-outline" size={64} color={theme.textMuted} />
            <Text style={[s.emptyText, { color: theme.text }]}>Nenhuma mesa cadastrada</Text>
          </View>
        ) : (
          mesas.map((mesa) => {
            const cfg = getStatusConfig(mesa.status);
            const comanda = resumoComanda(mesa.id);
            const temPedidos = comanda.qtdPedidos > 0;

            return (
              <TouchableOpacity
                key={mesa.id}
                style={[s.mesaCard, { backgroundColor: theme.card, borderColor: cfg.color }]}
                onPress={() =>
                  router.push({
                    pathname: '/admin/mesa-pedidos',
                    params: {
                      mesaId: String(mesa.id),
                      mesaNumero: String(mesa.numero),
                      mesaStatus: mesa.status || '',
                    },
                  })
                }
                activeOpacity={0.75}
              >
                {/* Header do card: número + status + capacidade */}
                <View style={s.mesaCardHeader}>
                  <View style={[s.mesaNumContainer, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.mesaNum, { color: cfg.color }]}>{mesa.numero}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.mesaLabel, { color: theme.text }]}>Mesa {mesa.numero}</Text>
                    {mesa.capacidade ? (
                      <Text style={[s.mesaCap, { color: theme.textSecondary }]}>
                        <Ionicons name="people-outline" size={11} /> {mesa.capacidade} lugares
                        {mesa.localizacao ? ` · ${mesa.localizacao}` : ''}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                    <Text style={[s.statusText, { color: cfg.color }]} numberOfLines={1}> {cfg.label}</Text>
                  </View>
                </View>

                {/* Resumo da comanda (só quando tem pedido) */}
                {temPedidos && (
                  <View style={[s.comandaBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <View style={s.comandaHeader}>
                      <Ionicons name="receipt-outline" size={13} color={theme.textSecondary} />
                      <Text style={[s.comandaTitle, { color: theme.textSecondary }]}>
                        {' '}Comanda · {comanda.qtdPedidos} {comanda.qtdPedidos === 1 ? 'pedido' : 'pedidos'}
                      </Text>
                    </View>
                    {comanda.itens.slice(0, 4).map((it) => (
                      <Text key={it.nome} style={[s.comandaItem, { color: theme.text }]} numberOfLines={1}>
                        • {it.q}x {it.nome}
                      </Text>
                    ))}
                    {comanda.itens.length > 4 && (
                      <Text style={[s.comandaMore, { color: theme.textSecondary }]}>
                        + {comanda.itens.length - 4} {comanda.itens.length - 4 === 1 ? 'item' : 'itens'}
                      </Text>
                    )}
                    <View style={[s.comandaTotalRow, { borderTopColor: theme.border }]}>
                      <Text style={[s.comandaTotalLabel, { color: theme.text }]}>Total</Text>
                      <Text style={[s.comandaTotalValue, { color: theme.primary }]}>
                        R$ {comanda.total.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
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
      paddingBottom: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: theme.headerText },
    headerSub: { fontSize: 13, color: theme.headerText, opacity: 0.75, marginTop: 2 },
    refreshBtn: { padding: 8 },
    summaryRow: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    summaryCard: { flex: 1, alignItems: 'center' },
    summaryNumber: { fontSize: 22, fontWeight: '800' },
    summaryLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
    grid: {
      padding: 12,
      gap: 10,
      paddingBottom: 32,
    },
    mesaCard: {
      borderRadius: 12,
      borderWidth: 1.5,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    mesaCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    mesaNumContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mesaNum: { fontSize: 18, fontWeight: '800' },
    mesaLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    mesaCap: { fontSize: 11 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexShrink: 0,
    },
    statusText: { fontSize: 11, fontWeight: '600' },
    comandaBox: {
      marginTop: 10,
      borderRadius: 8,
      borderWidth: 1,
      padding: 10,
    },
    comandaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    comandaTitle: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    comandaItem: { fontSize: 13, marginBottom: 2 },
    comandaMore: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
    comandaTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
    },
    comandaTotalLabel: { fontSize: 13, fontWeight: '600' },
    comandaTotalValue: { fontSize: 16, fontWeight: '800' },
    loadingText: { marginTop: 12, fontSize: 15, color: theme.textSecondary },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
    emptyText: { fontSize: 16, fontWeight: '600' },
  });
}