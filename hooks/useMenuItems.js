// hooks/useMenuItems.js
// TanStack Query hooks para cardápio (API Java)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/menuService';

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const menuKeys = {
  all: ['menu'],
  list: (categoria) => ['menu', 'list', categoria],
  detail: (id) => ['menu', 'detail', id],
};

// ─── HOOKS ───────────────────────────────────────────────────────────────────

// Lista todos os itens (opcional: por categoria)
export function useMenuItems(categoria = null) {
  return useQuery({
    queryKey: menuKeys.list(categoria),
    queryFn: () => fetchMenuItems(categoria),
    staleTime: 5 * 60 * 1000, // 5 min — cardápio muda pouco
    retry: 2,
  });
}

// Criar item
export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemData) => createMenuItem(itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}

// Atualizar item
export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, itemData }) => updateMenuItem(itemId, itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}

// Deletar item
export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => deleteMenuItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}

