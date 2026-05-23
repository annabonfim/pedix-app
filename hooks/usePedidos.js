// hooks/usePedidos.js
// Hooks de consulta e mutação para pedidos (API .NET / C#).
//
// Modelo: comanda é POR CLIENTE (não por mesa).
//   - cliente vê só os pedidos DELE (useMeusPedidos / fetchPedidosByCliente)
//   - garçom/admin vê todos os pedidos de uma mesa (usePedidosByMesa)
//   - createPedido aceita clienteId — mesaId vem do AsyncStorage (storage da mesa atual)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPedidosByCliente,
  fetchPedidosByMesa,
  fetchPedidoById,
  fetchAllPedidos,
  createPedido,
  atualizarPedido,
  deletarPedido,
  atualizarStatusPedido,
} from '../services/pedidoService';
import { useAuth } from '../context/AuthContext';

// ─── CHAVES DE CONSULTA ───────────────────────────────────────────────────────
export const pedidoKeys = {
  all: ['pedidos'],
  byCliente: (id) => ['pedidos', 'cliente', id],
  byMesa:    (id) => ['pedidos', 'mesa', id],
  detail:    (id) => ['pedidos', 'detail', id],
};

// ─── CONSULTAS ────────────────────────────────────────────────────────────────

// Lista pedidos do cliente logado — a comanda dele.
export function useMeusPedidos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: pedidoKeys.byCliente(user?.id),
    queryFn: () => fetchPedidosByCliente(user?.id),
    enabled: !!user?.id,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnMount: 'always',
    staleTime: 0,
    retry: 2,
  });
}

// Quando quer pedidos de outro cliente específico (raro — garçom investigando, etc)
export function usePedidosByCliente(clienteId) {
  return useQuery({
    queryKey: pedidoKeys.byCliente(clienteId),
    queryFn: () => fetchPedidosByCliente(clienteId),
    enabled: !!clienteId,
    refetchInterval: 5_000,
    staleTime: 0,
  });
}

// Dashboard de mesas — todos os pedidos (admin/garçom)
export function useAllPedidos() {
  return useQuery({
    queryKey: ['pedidos', 'all'],
    queryFn: fetchAllPedidos,
    refetchInterval: 5_000,
    staleTime: 0,
  });
}

// Pra garçom ver pedidos de uma mesa específica
export function usePedidosByMesa(mesaId) {
  return useQuery({
    queryKey: pedidoKeys.byMesa(mesaId),
    queryFn: () => fetchPedidosByMesa(mesaId),
    enabled: !!mesaId,
    refetchInterval: 5_000,
    staleTime: 0,
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

// ─── OPERAÇÕES ────────────────────────────────────────────────────────────────

// Criar pedido — clienteId vem do auth, items do carrinho
export function useCreatePedido() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ items, observacao }) => createPedido(user?.id, items, observacao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.byCliente(user?.id) });
    },
  });
}

// Atualizar pedido (cancela + recria com novos items)
export function useAtualizarPedido() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pedidoId, items, observacao }) =>
      atualizarPedido(pedidoId, user?.id, items, observacao),
    onSuccess: (_, { pedidoId }) => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.byCliente(user?.id) });
      queryClient.invalidateQueries({ queryKey: pedidoKeys.detail(pedidoId) });
    },
  });
}

// Cancelar pedido (soft delete via PUT status=CANCELADO)
export function useDeletarPedido() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pedidoId) => deletarPedido(pedidoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.byCliente(user?.id) });
    },
  });
}

// Atualizar status (garçom marca como PRONTO/ENTREGUE)
export function useAtualizarStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pedidoId, status }) => atualizarStatusPedido(pedidoId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.all });
    },
  });
}
