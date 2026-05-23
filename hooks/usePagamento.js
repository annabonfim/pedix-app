// hooks/usePagamento.js
// Fluxo completo de pagamento: cria → espera 2s simulando processamento →
// chama aprovar → dispara notificação local. Tudo numa mutation só.

import { useMutation } from '@tanstack/react-query';
import { criarPagamento, aprovarPagamento } from '../services/pagamentoService';
import { notifyPagamentoAprovado } from '../utils/notifications';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';

const DELAY_APROVACAO_MS = 2500;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function usePagamento() {
  const { user } = useAuth();

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
  });
}
