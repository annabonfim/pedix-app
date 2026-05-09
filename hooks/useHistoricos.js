// hooks/useHistoricos.js
import { useQuery } from '@tanstack/react-query';
import { fetchHistoricos, fetchHistoricoByPedido } from '../services/historicoService';

export const historicoKeys = {
  all: ['historicos'],
  list: () => ['historicos', 'list'],
  byPedido: (pedidoId) => ['historicos', 'pedido', pedidoId],
};

export function useHistoricos() {
  return useQuery({
    queryKey: historicoKeys.list(),
    queryFn: fetchHistoricos,
    staleTime: 30_000,
  });
}

export function useHistoricoByPedido(pedidoId) {
  return useQuery({
    queryKey: historicoKeys.byPedido(pedidoId),
    queryFn: () => fetchHistoricoByPedido(pedidoId),
    enabled: !!pedidoId,
    staleTime: 30_000,
  });
}
