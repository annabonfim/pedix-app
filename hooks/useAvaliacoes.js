// hooks/useAvaliacoes.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAvaliacoes, createAvaliacao, deleteAvaliacao } from '../services/avaliacaoService';

export const avaliacaoKeys = {
  all: ['avaliacoes'],
  list: () => ['avaliacoes', 'list'],
};

export function useAvaliacoes() {
  return useQuery({
    queryKey: avaliacaoKeys.list(),
    queryFn: fetchAvaliacoes,
    staleTime: 60_000,
  });
}

export function useCreateAvaliacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAvaliacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: avaliacaoKeys.all });
    },
  });
}

export function useDeleteAvaliacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvaliacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: avaliacaoKeys.all });
    },
  });
}
