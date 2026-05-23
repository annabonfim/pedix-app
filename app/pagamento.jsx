// app/pagamento.jsx
// Tela de pagamento: cliente vê total da mesa, escolhe método, confirma.
// Auto-aprovação simula maquininha (delay ~2.5s) e dispara notif local.

import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useMeusPedidos } from '../hooks/usePedidos';
import { usePagamento } from '../hooks/usePagamento';
import { useMenuItems } from '../hooks/useMenuItems';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config/constants';
import { colors, shared } from '../styles/theme';

const MASCOT = require('../assets/pedix-mascot.png');

const METODOS = [
  { value: 'PIX',      label: 'PIX',                icon: 'qr-code-outline' },
  { value: 'CREDITO',  label: 'Cartão de crédito',  icon: 'card-outline' },
  { value: 'DEBITO',   label: 'Cartão de débito',   icon: 'card-outline' },
  { value: 'DINHEIRO', label: 'Dinheiro',           icon: 'cash-outline' },
];

// Soma o total de um pedido (mesma lógica do orders.jsx)
function calculatePedidoTotal(pedido) {
  if (pedido.total) return parseFloat(pedido.total);
  if (!pedido.itens?.length) return 0;
  return pedido.itens.reduce((sum, item) => {
    return sum + parseFloat(item.subtotal || item.precoUnitario * (item.quantidade || 1) || 0);
  }, 0);
}

// Agrega itens de todos os pedidos por nome (mesmo item em pedidos diferentes vira uma linha só)
function aggregateItens(pedidos, itemNameById) {
  const map = new Map();
  for (const pedido of pedidos) {
    for (const item of pedido.itens || []) {
      const nome =
        item.nome ||
        item.itemCardapio?.nome ||
        item.itemCardapio?.name ||
        itemNameById[item.itemCardapioId] ||
        `Item #${item.itemCardapioId}`;
      const quantidade = item.quantidade || 1;
      const subtotal = parseFloat(
        item.subtotal || item.precoUnitario * quantidade || 0
      );
      const prev = map.get(nome) || { nome, quantidade: 0, subtotal: 0 };
      prev.quantidade += quantidade;
      prev.subtotal += subtotal;
      map.set(nome, prev);
    }
  }
  return Array.from(map.values());
}

export default function PagamentoScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const [tableNumber, setTableNumber] = useState(null);
  const [metodo, setMetodo] = useState('PIX');

  useEffect(() => {
    AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER).then((val) => {
      if (val) setTableNumber(parseInt(val, 10));
    });
  }, []);

  // Reset do método e mesa quando user desloga — senão Cliente B vê PIX
  // (ou qualquer escolha do Cliente A) pré-selecionado no próximo login.
  useEffect(() => {
    if (!isAuthenticated) {
      setMetodo('PIX');
      setTableNumber(null);
    }
  }, [isAuthenticated]);

  const { data: pedidos = [], isLoading } = useMeusPedidos();
  const { data: menuItems = [] } = useMenuItems();
  const pagamento = usePagamento();

  // Mapa itemCardapioId → nome (pra mostrar nome em vez de "Item #1")
  const itemNameById = menuItems.reduce((acc, it) => {
    acc[it.id] = it.name;
    return acc;
  }, {});

  // Considera só pedidos não-cancelados pra somar o total
  const pedidosPagaveis = pedidos.filter(
    (p) => (p.status || '').toUpperCase() !== 'CANCELADO'
  );
  const itensAgregados = aggregateItens(pedidosPagaveis, itemNameById);
  const total = pedidosPagaveis.reduce((s, p) => s + calculatePedidoTotal(p), 0);
  const totalFmt = total.toFixed(2).replace('.', ',');

  const handlePagar = () => {
    if (total <= 0) {
      Alert.alert('Nada a pagar', 'Você não tem pedidos em aberto pra pagar.');
      return;
    }
    pagamento.mutate(
      { valor: total, metodoPagamento: metodo },
      {
        onSuccess: () => {
          Alert.alert(
            '✅ Pagamento aprovado!',
            `R$ ${totalFmt} via ${metodo}.\nObrigada pela visita! 🍝\n\nQue tal avaliar sua experiência?`,
            [{ text: 'Avaliar', onPress: () => router.replace('/avaliacao-form') }]
          );
        },
        onError: (err) => {
          Alert.alert(
            'Erro no pagamento',
            err?.message || 'Não foi possível processar o pagamento. Tenta de novo.'
          );
        },
      }
    );
  };

  const processando = pagamento.isPending;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={s.headerTitle}>Pagamento</Text>
            <Text style={s.headerSub}>
              {user?.nome ? `${user.nome}` : 'Sua conta'}
              {tableNumber ? ` · Mesa ${tableNumber}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} disabled={processando}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* Resumo da conta */}
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}>
          <Text style={[s.cardLabel, { color: theme.textSecondary }]}>Sua conta</Text>

          {isLoading ? (
            <ActivityIndicator color={colors.orange} style={{ marginVertical: 16 }} />
          ) : itensAgregados.length === 0 ? (
            <Text style={[s.empty, { color: theme.textSecondary }]}>
              Sem itens pra pagar
            </Text>
          ) : (
            <>
              {itensAgregados.map((item) => (
                <View key={item.nome} style={s.pedidoLine}>
                  <Text style={[s.pedidoLineText, { color: theme.text }]} numberOfLines={1}>
                    {item.quantidade}x {item.nome}
                  </Text>
                  <Text style={[s.pedidoLineValue, { color: theme.text }]}>
                    R$ {item.subtotal.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              ))}

              <View style={[s.divider, { backgroundColor: colors.border }]} />

              <View style={s.totalLine}>
                <Text style={[s.totalLabel, { color: theme.text }]}>Total</Text>
                <Text style={[s.totalValue, { color: colors.orange }]}>
                  R$ {totalFmt}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Seletor de método */}
        <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>
          Forma de pagamento
        </Text>

        <View style={s.metodos}>
          {METODOS.map((m) => {
            const selected = metodo === m.value;
            return (
              <TouchableOpacity
                key={m.value}
                style={[
                  s.metodoBtn,
                  { backgroundColor: theme.surface, borderColor: colors.border },
                  selected && { borderColor: colors.orange, backgroundColor: colors.orangePale },
                ]}
                onPress={() => setMetodo(m.value)}
                disabled={processando}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={m.icon}
                  size={22}
                  color={selected ? colors.orange : colors.textSub}
                />
                <Text style={[
                  s.metodoLabel,
                  { color: theme.text },
                  selected && { color: colors.orange, fontWeight: '700' },
                ]}>
                  {m.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.orange} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer fixo com botão */}
      <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            s.payBtn,
            { backgroundColor: colors.orange },
            (processando || total <= 0) && { opacity: 0.6 },
          ]}
          onPress={handlePagar}
          disabled={processando || total <= 0}
        >
          {processando ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={s.payBtnText}>  Processando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
              <Text style={s.payBtnText}>  Pagar R$ {totalFmt}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  content: { padding: 16, gap: 16, paddingBottom: 32 },

  card: {
    borderRadius: 14, borderWidth: 1, padding: 16,
    shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  cardLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  pedidoLine: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  pedidoLineText:  { fontSize: 14, flex: 1, paddingRight: 12 },
  pedidoLineValue: { fontSize: 14, fontWeight: '600' },

  divider: { height: 1, marginVertical: 10 },

  totalLine: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800' },

  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 4, marginBottom: -6, paddingHorizontal: 4,
  },

  metodos: { gap: 8 },
  metodoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 12, padding: 14,
  },
  metodoLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  footer: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
    borderTopWidth: 1,
  },
  payBtn: {
    borderRadius: 12, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  payBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
