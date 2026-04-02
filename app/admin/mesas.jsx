// app/admin/mesas.jsx
// Tela exclusiva do GARÇOM/ADMIN
// Mostra todas as mesas com status e acesso aos pedidos de cada uma

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMesas } from '../../hooks/useMesas';

// ─── STATUS DA MESA ──────────────────────────────────────────────────────────
// Adapte os valores conforme o enum da sua API C#
// ex: 'DISPONIVEL', 'OCUPADA', 'RESERVADA', 'INDISPONIVEL'
const STATUS_CONFIG = {
  DISPONIVEL: { label: 'Disponível', color: '#28A745', bg: '#D4EDDA', icon: 'checkmark-circle-outline' },
  OCUPADA:    { label: 'Ocupada',    color: '#FF6B35', bg: '#FFE8DF', icon: 'people-outline'           },
  RESERVADA:  { label: 'Reservada',  color: '#FFC107', bg: '#FFF3CD', icon: 'time-outline'             },
  INDISPONIVEL: { label: 'Indisp.',  color: '#6C757D', bg: '#E2E3E5', icon: 'close-circle-outline'     },
};

function getStatusConfig(status) {
  const key = (status || '').toUpperCase();
  return STATUS_CONFIG[key] || STATUS_CONFIG.DISPONIVEL;
}

export default function AdminMesasScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const { data: mesas = [], isLoading, isFetching, refetch } = useMesas();

  const s = makeStyles(theme);

  // Conta por status para o resumo no topo
  const counts = mesas.reduce((acc, m) => {
    const key = (m.status || '').toUpperCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={s.loadingText}>Carregando mesas...</Text>
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
          <Text style={[s.summaryNumber, { color: '#28A745' }]}>{counts.DISPONIVEL || 0}</Text>
          <Text style={s.summaryLabel}>Disponíveis</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryNumber, { color: theme.primary }]}>{counts.OCUPADA || 0}</Text>
          <Text style={s.summaryLabel}>Ocupadas</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryNumber, { color: '#FFC107' }]}>{counts.RESERVADA || 0}</Text>
          <Text style={s.summaryLabel}>Reservadas</Text>
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
            const isOcupada = (mesa.status || '').toUpperCase() === 'OCUPADA';

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
                {/* Número da mesa */}
                <View style={[s.mesaNumContainer, { backgroundColor: cfg.bg }]}>
                  <Text style={[s.mesaNum, { color: cfg.color }]}>{mesa.numero}</Text>
                </View>

                {/* Info */}
                <Text style={[s.mesaLabel, { color: theme.text }]}>Mesa {mesa.numero}</Text>
                {mesa.capacidade ? (
                  <Text style={[s.mesaCap, { color: theme.textSecondary }]}>
                    <Ionicons name="people-outline" size={11} /> {mesa.capacidade} lugares
                  </Text>
                ) : null}
                {mesa.localizacao ? (
                  <Text style={[s.mesaLoc, { color: theme.textSecondary }]} numberOfLines={1}>
                    {mesa.localizacao}
                  </Text>
                ) : null}

                {/* Badge de status */}
                <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                  <Text style={[s.statusText, { color: cfg.color }]}> {cfg.label}</Text>
                </View>

                {/* Indicador de pedidos pendentes */}
                {isOcupada && (
                  <View style={s.pedidosIndicator}>
                    <Ionicons name="receipt-outline" size={12} color={theme.primary} />
                    <Text style={[s.pedidosText, { color: theme.primary }]}> Ver pedidos</Text>
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 12,
      gap: 10,
    },
    mesaCard: {
      width: '47%',
      borderRadius: 12,
      borderWidth: 1.5,
      padding: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    mesaNumContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    mesaNum: { fontSize: 22, fontWeight: '800' },
    mesaLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    mesaCap: { fontSize: 12, marginBottom: 2 },
    mesaLoc: { fontSize: 11, marginBottom: 6, maxWidth: '100%' },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginTop: 4,
    },
    statusText: { fontSize: 11, fontWeight: '600' },
    pedidosIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    pedidosText: { fontSize: 11, fontWeight: '600' },
    loadingText: { marginTop: 12, fontSize: 15, color: theme.textSecondary },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
    emptyText: { fontSize: 16, fontWeight: '600' },
  });
}