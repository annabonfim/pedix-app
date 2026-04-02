// hooks/usePedidos.js
// TanStack Query hooks para pedidos (API Java)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPedidosByComanda,
  fetchPedidoById,
  createPedido,
  atualizarPedido,
  deletarPedido,
  atualizarStatusPedido,
} from '../services/pedidoService';

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const pedidoKeys = {
  all: ['pedidos'],
  byComanda: (id) => ['pedidos', 'comanda', id],
  detail: (id) => ['pedidos', 'detail', id],
};

// ─── QUERIES ─────────────────────────────────────────────────────────────────

// Lista pedidos de uma comanda
export function usePedidosByComanda(comandaId) {
  return useQuery({
    queryKey: pedidoKeys.byComanda(comandaId),
    queryFn: () => fetchPedidosByComanda(comandaId),
    enabled: !!comandaId,
    refetchInterval: 30_000, // polling a cada 30s para ver status em tempo real
    retry: 2,
  });
}

// Detalhe de um pedido
export function usePedido(pedidoId) {
  return useQuery({
    queryKey: pedidoKeys.detail(pedidoId),
    queryFn: () => fetchPedidoById(pedidoId),
    enabled: !!pedidoId,
  });
}

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

// Criar pedido
export function useCreatePedido(comandaId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ items, observacao }) => createPedido(comandaId, items, observacao),
    onSuccess: () => {
      // Invalida a lista de pedidos → refetch automático
      queryClient.invalidateQueries({ queryKey: pedidoKeys.byComanda(comandaId) });
    },
  });
}

// Atualizar pedido
export function useAtualizarPedido(comandaId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pedidoId, items, observacao }) =>
      atualizarPedido(pedidoId, comandaId, items, observacao),
    onSuccess: (_, { pedidoId }) => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.byComanda(comandaId) });
      queryClient.invalidateQueries({ queryKey: pedidoKeys.detail(pedidoId) });
    },
  });
}

// Cancelar / deletar pedido
export function useDeletarPedido(comandaId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pedidoId) => deletarPedido(pedidoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.byComanda(comandaId) });
    },
  });
}

// Atualizar status
export function useAtualizarStatus(comandaId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pedidoId, status }) => atualizarStatusPedido(pedidoId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.byComanda(comandaId) });
    },
  });
}