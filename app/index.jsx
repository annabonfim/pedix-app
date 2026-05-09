import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useMesas } from '../hooks/useMesas';
import { colors, shared, typography } from '../styles/theme';
import { APP_CONFIG } from '../config/constants';

const MASCOT = require('../assets/pedix-mascot.png');

export default function IndexScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tableNumber, setTableNumber] = useState(null);

  const { isAdmin, isGerente } = useAuth();

  useEffect(() => {
    AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER)
      .then(v => {
        if (v) {
          setTableNumber(parseInt(v, 10));
        } else if (!isAdmin) {
          // Cliente sem mesa → redireciona pro scan
          router.replace('/scan');
        }
      });
  }, []);
  const firstName = (user?.nome || 'você').split(' ')[0];

  // Garçom: busca mesas pra mostrar resumo na home
  const { data: mesas = [] } = useMesas();
  const mesasLivres = mesas.filter(m => (m.status || '').toUpperCase() === 'LIVRE').length;
  const mesasOcupadas = mesas.filter(m => (m.status || '').toUpperCase() === 'OCUPADA').length;

  const quickItems = isGerente
    ? [
        { icon: 'grid-outline',         label: 'Mesas',      route: '/admin/mesas' },
        { icon: 'restaurant-outline',   label: 'Cardápio',   route: '/menu' },
        { icon: 'pricetags-outline',    label: 'Categorias', route: '/gerente/categorias' },
        { icon: 'bar-chart-outline',    label: 'Relatórios', route: '/gerente/relatorios' },
        { icon: 'star-outline',         label: 'Avaliações', route: '/avaliacoes' },
        { icon: 'time-outline',         label: 'Histórico',  route: '/historico' },
      ]
    : isAdmin
    ? [
        { icon: 'grid-outline',         label: 'Mesas',      route: '/admin/mesas' },
        { icon: 'restaurant-outline',   label: 'Cardápio',   route: '/menu' },
        { icon: 'star-outline',         label: 'Avaliações', route: '/avaliacoes' },
        { icon: 'time-outline',         label: 'Histórico',  route: '/historico' },
      ]
    : [
        { icon: 'restaurant-outline', label: 'Cardápio',   route: '/menu' },
        { icon: 'receipt-outline',    label: 'Pedidos',    route: '/orders' },
        { icon: 'star-outline',       label: 'Avaliações', route: '/avaliacoes' },
        { icon: 'time-outline',       label: 'Histórico',  route: '/historico' },
      ];

  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>

      {/* Header navy com gradiente visual */}
      <View style={s.hero}>
        <View style={s.heroTop}>
          <View>
            <Text style={s.greeting}>Bem-vindo de volta,</Text>
            <Text style={s.name}>{firstName} 👋</Text>
            <Text style={s.sub}>
              {tableNumber ? `Mesa ${tableNumber} · Italiano` : 'Selecione sua mesa'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity onPress={toggleTheme} style={s.logoutBtn}>
              <Ionicons
                name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={20} color="rgba(255,255,255,0.75)"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={s.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick access cards — flutuam sobre o header */}
      <View style={s.quickRow}>
        {quickItems.map(item => (
          <TouchableOpacity
            key={item.route}
            style={[s.quickCard, { backgroundColor: theme.surface, borderColor: colors.border }]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.75}
          >
            <Ionicons name={item.icon} size={24} color={colors.orange} />
            <Text style={[s.quickLabel, { color: theme.text }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* ─── GARÇOM: resumo de mesas ─── */}
        {isAdmin && (
          <>
            <Text style={[typography.sectionTitle, { color: theme.textSecondary, marginBottom: 8 }]}>
              Resumo das mesas
            </Text>
            <View style={s.mesasSummaryRow}>
              <TouchableOpacity
                style={[shared.card, s.mesasSummaryCard, { backgroundColor: theme.surface, borderColor: colors.border }]}
                onPress={() => router.push('/admin/mesas')}
              >
                <Text style={[s.mesasSummaryNumber, { color: '#28A745' }]}>{mesasLivres}</Text>
                <Text style={[s.mesasSummaryLabel, { color: theme.textSecondary }]}>Livres</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[shared.card, s.mesasSummaryCard, { backgroundColor: theme.surface, borderColor: colors.border }]}
                onPress={() => router.push('/admin/mesas')}
              >
                <Text style={[s.mesasSummaryNumber, { color: colors.orange }]}>{mesasOcupadas}</Text>
                <Text style={[s.mesasSummaryLabel, { color: theme.textSecondary }]}>Ocupadas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[shared.card, s.mesasSummaryCard, { backgroundColor: theme.surface, borderColor: colors.border }]}
                onPress={() => router.push('/admin/mesas')}
              >
                <Text style={[s.mesasSummaryNumber, { color: theme.text }]}>{mesas.length}</Text>
                <Text style={[s.mesasSummaryLabel, { color: theme.textSecondary }]}>Total</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── CLIENTE: selecionar mesa ─── */}
        {!isAdmin && !tableNumber && (
          <>
            <Text style={[typography.sectionTitle, { color: theme.textSecondary, marginBottom: 8 }]}>
              Comece agora
            </Text>
            <View style={[shared.card, s.emptyCard, { backgroundColor: theme.surface, borderColor: colors.border }]}>
              <Image source={MASCOT} style={s.mascotEmpty} resizeMode="contain" />
              <Text style={[s.emptyTitle, { color: theme.text }]}>Selecione sua mesa</Text>
              <Text style={[s.emptySub, { color: theme.textSecondary }]}>
                Escaneie o QR Code da sua mesa ou informe o número manualmente
              </Text>
              <TouchableOpacity
                style={[shared.btnPrimary, s.emptyBtn]}
                onPress={() => router.push('/scan')}
              >
                <Text style={shared.btnPrimaryText}>Escolher mesa</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Sugestão do dia — só aparece após selecionar mesa */}
        {(isAdmin || tableNumber) && (
          <>
            <Text style={[typography.sectionTitle, { color: theme.textSecondary, marginTop: 8, marginBottom: 8 }]}>
              Sugestão do dia
            </Text>
            <TouchableOpacity
              style={[shared.card, s.suggestCard, { backgroundColor: theme.surface, borderColor: colors.border }]}
              onPress={() => router.push('/menu')}
              activeOpacity={0.8}
            >
              <View style={s.suggestEmoji}>
                <Text style={{ fontSize: 28 }}>🍝</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.suggestName, { color: theme.text }]}>Spaghetti Carbonara</Text>
                <Text style={[s.suggestDesc, { color: theme.textSecondary }]}>
                  Massa italiana com molho cremoso, bacon e parmesão
                </Text>
                <Text style={[typography.price, { marginTop: 6 }]}>R$ 52,00</Text>
              </View>
              <TouchableOpacity style={s.addBtn} onPress={() => router.push('/menu')}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy,
    paddingTop: 52, paddingBottom: 38, paddingHorizontal: 20,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  name:     { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  sub:      { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  logoutBtn: { padding: 8 },

  // Quick cards
  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginTop: -20, paddingHorizontal: 16,
  },
  quickCard: {
    width: '31%', borderRadius: 12, padding: 12, borderWidth: 1,
    alignItems: 'center', gap: 6,
    shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  content: { padding: 16, gap: 12, paddingTop: 20 },

  // Último pedido
  pedidoHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  pedidoId:   { fontSize: 15, fontWeight: '700' },
  pedidoDate: { fontSize: 11, marginTop: 2 },
  itensBox: { borderRadius: 8, padding: 10, marginBottom: 8 },
  itensText: { fontSize: 13, lineHeight: 20 },
  pedidoFooter: { alignItems: 'flex-end' },

  // Mesas summary (garçom)
  mesasSummaryRow: { flexDirection: 'row', gap: 10 },
  mesasSummaryCard: { flex: 1, alignItems: 'center', padding: 16, gap: 4 },
  mesasSummaryNumber: { fontSize: 28, fontWeight: '800' },
  mesasSummaryLabel: { fontSize: 12 },

  // Empty state
  emptyCard: { alignItems: 'center', padding: 28, gap: 8 },
  mascotEmpty: { width: 100, height: 100 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  emptyBtn:   { marginTop: 8, paddingHorizontal: 24, borderRadius: 12 },

  // Sugestão
  suggestCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  suggestEmoji: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: colors.grayPale,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestName: { fontSize: 14, fontWeight: '600' },
  suggestDesc: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
  },
});