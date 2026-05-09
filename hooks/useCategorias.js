// hooks/useCategorias.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '../services/categoriaService';

export const categoriaKeys = {
  all: ['categorias'],
  list: () => ['categorias', 'list'],
};

export function useCategorias() {
  return useQuery({
    queryKey: categoriaKeys.list(),
    queryFn: fetchCategorias,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriaKeys.all }),
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCategoria(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriaKeys.all }),
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriaKeys.all }),
  });
}
