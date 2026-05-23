import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useMesas } from '../hooks/useMesas';
import { useMenuItems } from '../hooks/useMenuItems';
import { useMeusPedidos } from '../hooks/usePedidos';
import { usePagamentoByPedido } from '../hooks/usePagamento';
import { colors, shared, typography } from '../styles/theme';
import { APP_CONFIG } from '../config/constants';
import { formatPedidoDate } from '../utils/time';

// Escolhe a sugestão do dia de forma determinística (varia a cada dia,
// mas fica fixa pra todos os clientes no mesmo dia). Usa o índice do dia
// do ano módulo o tamanho do cardápio.
function pickSuggestionForToday(items) {
  if (!items?.length) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86_400_000);
  return items[dayOfYear % items.length];
}

const MASCOT = require('../assets/pedix-mascot.png');

// Tradução do método de pagamento da API .NET pra UI.
const METODO_LABEL = {
  PIX:      { label: 'Pix',       icon: 'flash-outline'      },
  CREDITO:  { label: 'Crédito',   icon: 'card-outline'       },
  DEBITO:   { label: 'Débito',    icon: 'card-outline'       },
  DINHEIRO: { label: 'Dinheiro',  icon: 'cash-outline'       },
};
function metodoInfo(metodo) {
  return METODO_LABEL[(metodo || '').toUpperCase()] || { label: metodo || '—', icon: 'help-circle-outline' };
}

// Card de um pedido finalizado no home. Busca o pagamento próprio pra mostrar
// método (Pix/Crédito/etc). Mantido como sub-componente pra cada card ter sua
// própria query (React Query cacheia por pedidoId).
function PedidoFinalizadoCard({ pedido, theme, onPress }) {
  const { data: pagamento } = usePagamentoByPedido(pedido.id);
  const shortId = String(pedido.id).slice(-4).toUpperCase();
  const total = pedido.total
    ? parseFloat(pedido.total)
    : (pedido.itens || []).reduce(
        (sum, it) => sum + parseFloat(it.subtotal || (it.precoUnitario * (it.quantidade || 1)) || 0),
        0
      );
  const m = metodoInfo(pagamento?.metodoPagamento);

  return (
    <TouchableOpacity
      style={[shared.card, s.historicoCard, { backgroundColor: theme.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={s.historicoHeader}>
        <Text style={[s.historicoId, { color: theme.text }]}>Pedido #{shortId}</Text>
        <Text style={[s.historicoTotal, { color: colors.orange }]}>
          R$ {total.toFixed(2).replace('.', ',')}
        </Text>
      </View>
      <Text style={[s.historicoDate, { color: theme.textSecondary }]}>
        {formatPedidoDate(pedido.dataPedido || pedido.dataCriacao)}
      </Text>
      <View style={s.historicoPagamento}>
        <Ionicons name={m.icon} size={14} color={pagamento ? '#198754' : theme.textMuted} />
        <Text style={[s.historicoMetodo, { color: pagamento ? '#198754' : theme.textMuted }]}>
          {pagamento ? `Pago via ${m.label}` : 'Sem registro de pagamento'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function IndexScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tableNumber, setTableNumber] = useState(null);

  const { isAdmin, isGerente } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Deseja voltar para a tela de login?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  // useFocusEffect (não useEffect): expo-router mantém telas montadas entre
  // trocas de tab, então um useEffect com [] só rodaria na primeira abertura
  // e não capturaria quando o cliente volta do Scan depois de escolher mesa.
  // Cliente sem mesa NÃO é redirecionado mais — a home se adapta mostrando
  // só o atalho "Selecionar mesa" (ver quickItems abaixo).
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER)
        .then(v => setTableNumber(v ? parseInt(v, 10) : null));
    }, [])
  );
  const firstName = (user?.nome || 'você').split(' ')[0];

  // Garçom: busca mesas pra mostrar resumo na home
  const { data: mesas = [] } = useMesas();
  const mesasLivres = mesas.filter(m => (m.status || '').toUpperCase() === 'LIVRE').length;
  const mesasOcupadas = mesas.filter(m => (m.status || '').toUpperCase() === 'OCUPADA').length;

  // Sugestão do dia: pega 1 item disponível do cardápio, determinístico por dia
  const { data: menuItems = [] } = useMenuItems();
  const itensDisponiveis = menuItems.filter((it) => it.available);
  const sugestaoDoDia = pickSuggestionForToday(itensDisponiveis);

  // Histórico recente: pega os 3 últimos pedidos FINALIZADOS do cliente
  // pra mostrar no home (com método de pagamento). Não roda pra garçom/gerente.
  const { data: meusPedidos = [] } = useMeusPedidos();
  const ultimosFinalizados = !isAdmin && !isGerente
    ? [...meusPedidos]
        .filter((p) => (p.status || '').toUpperCase() === 'FINALIZADO')
        .sort((a, b) => new Date(b.dataPedido || 0) - new Date(a.dataPedido || 0))
        .slice(0, 3)
    : [];

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
    : tableNumber
    ? [
        // "Pedidos" no home = histórico (passados/finalizados).
        // A comanda em aberto fica no tab "Pedidos" do bottom menu.
        { icon: 'restaurant-outline', label: 'Cardápio',   route: '/menu' },
        { icon: 'time-outline',       label: 'Pedidos',    route: '/historico' },
        { icon: 'star-outline',       label: 'Avaliações', route: '/avaliacoes' },
      ]
    : [
        { icon: 'qr-code-outline', label: 'Selecionar mesa', route: '/scan' },
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
              {isGerente
                ? 'Painel do gerente'
                : isAdmin
                ? 'Painel do garçom'
                : tableNumber
                ? `Mesa ${tableNumber} · Italiano`
                : 'Selecione sua mesa'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity onPress={toggleTheme} style={s.logoutBtn}>
              <Ionicons
                name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={20} color="rgba(255,255,255,0.75)"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
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

        {/* Histórico recente do cliente (3 últimos finalizados, com método de pagamento).
            Aparece tanto sem mesa (depois do "Selecionar mesa") quanto com mesa. */}
        {ultimosFinalizados.length > 0 && (
          <>
            <View style={s.historicoSectionHeader}>
              <Text style={[typography.sectionTitle, { color: theme.textSecondary }]}>
                Seus pedidos passados
              </Text>
              <TouchableOpacity onPress={() => router.push('/historico')}>
                <Text style={s.historicoVerTodos}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            {ultimosFinalizados.map((pedido) => (
              <PedidoFinalizadoCard
                key={pedido.id}
                pedido={pedido}
                theme={theme}
                onPress={() => router.push('/historico')}
              />
            ))}
          </>
        )}

        {/* Sugestão do dia — só aparece após selecionar mesa e se tiver cardápio carregado */}
        {(isAdmin || tableNumber) && sugestaoDoDia && (
          <>
            <Text style={[typography.sectionTitle, { color: theme.textSecondary, marginTop: 8, marginBottom: 8 }]}>
              Sugestão do dia
            </Text>
            <TouchableOpacity
              style={[shared.card, s.suggestCard, { backgroundColor: theme.surface, borderColor: colors.border }]}
              onPress={() => router.push({
                pathname: '/item',
                params: {
                  id: sugestaoDoDia.id,
                  name: sugestaoDoDia.name,
                  price: String(sugestaoDoDia.price),
                  description: sugestaoDoDia.description || '',
                  image: sugestaoDoDia.image || '',
                },
              })}
              activeOpacity={0.8}
            >
              <View style={s.suggestEmoji}>
                <Text style={{ fontSize: 28 }}>
                  {typeof sugestaoDoDia.image === 'string' && sugestaoDoDia.image.length <= 4
                    ? sugestaoDoDia.image
                    : '🍽️'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.suggestName, { color: theme.text }]} numberOfLines={1}>
                  {sugestaoDoDia.name}
                </Text>
                <Text style={[s.suggestDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                  {sugestaoDoDia.description || 'Experimente esta sugestão do chef'}
                </Text>
                <Text style={[typography.price, { marginTop: 6 }]}>
                  R$ {Number(sugestaoDoDia.price || 0).toFixed(2).replace('.', ',')}
                </Text>
              </View>
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

  // Histórico recente no home
  historicoSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, marginBottom: 8,
  },
  historicoVerTodos: { color: colors.orange, fontSize: 13, fontWeight: '700' },
  historicoCard: { padding: 12 },
  historicoHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  historicoId:    { fontSize: 14, fontWeight: '700' },
  historicoTotal: { fontSize: 15, fontWeight: '800' },
  historicoDate:  { fontSize: 12, marginTop: 2 },
  historicoPagamento: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)',
  },
  historicoMetodo: { fontSize: 13, fontWeight: '600' },

  // Quick cards
  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginTop: -20, paddingHorizontal: 16,
  },
  quickCard: {
    flex: 1, minWidth: 70, borderRadius: 12, padding: 10, borderWidth: 1,
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