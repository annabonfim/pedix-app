// hooks/usePagamento.js
// Fluxo completo de pagamento: cria → espera 2s simulando processamento →
// chama aprovar → dispara notificação local. Tudo numa mutation só.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  criarPagamento,
  aprovarPagamento,
  fetchPagamentoByPedido,
} from '../services/pagamentoService';
import { notifyPagamentoAprovado } from '../utils/notifications';
import { useAuth } from '../context/AuthContext';
import { pedidoKeys } from './usePedidos';
import { APP_CONFIG } from '../config/constants';
import { logger } from '../utils/logger';

// Chave de cache pra pagamento de um pedido. Cache fica vivo entre re-renders
// pra não fazer N requests quando o cliente abre o histórico de novo.
export const pagamentoKeys = {
  byPedido: (pedidoId) => ['pagamento', 'pedido', pedidoId],
};

// Busca (e cacheia) o pagamento APROVADO de um pedido específico. Retorna null
// se o pedido ainda não foi pago. Usado nos cards do histórico pra mostrar
// método (PIX/CREDITO/etc) e valor pago.
export function usePagamentoByPedido(pedidoId) {
  return useQuery({
    queryKey: pagamentoKeys.byPedido(pedidoId),
    queryFn: () => fetchPagamentoByPedido(pedidoId),
    enabled: !!pedidoId,
    staleTime: 2 * 60 * 1000, // 2 min — pagamento finalizado não muda
    retry: 1,
  });
}

const DELAY_APROVACAO_MS = 2500;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function usePagamento() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ valor, metodoPagamento }) => {
      logger.log('[PAGAMENTO] criando pagamento de R$', valor, 'via', metodoPagamento);

      const pagamento = await criarPagamento({
        valor,
        metodoPagamento,
        clienteId: user?.id,
      });
      logger.log('[PAGAMENTO] criado, id:', pagamento.id);

      // Simula processamento da maquininha
      await wait(DELAY_APROVACAO_MS);

      const aprovado = await aprovarPagamento(pagamento.id);
      logger.log('[PAGAMENTO] aprovado:', aprovado.status);

      // Dispara notificação local
      await notifyPagamentoAprovado({
        valor,
        metodoPagamento,
        pagamentoId: pagamento.id,
      });

      return aprovado;
    },
    onSuccess: async () => {
      // Backend marcou pedidos como FINALIZADO e liberou a mesa. Reflete no app:
      // 1) refetch dos pedidos do cliente (sumir botão "Pagar conta")
      // 2) limpar a mesa local (cliente sai da experiência da mesa — bottom
      //    tabs voltam a esconder, igual antes de escanear o QR)
      queryClient.invalidateQueries({ queryKey: pedidoKeys.byCliente(user?.id) });
      await AsyncStorage.multiRemove([
        APP_CONFIG.STORAGE_KEYS.MESA_ID,
        APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER,
        APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID,
      ]);
    },
  });
}
