// hooks/useRelatorios.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRelatorios, createRelatorio } from '../services/relatorioService';

export const relatorioKeys = {
  all: ['relatorios'],
  list: () => ['relatorios', 'list'],
};

export function useRelatorios() {
  return useQuery({
    queryKey: relatorioKeys.list(),
    queryFn: fetchRelatorios,
    staleTime: 60_000,
  });
}

export function useCreateRelatorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRelatorio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relatorioKeys.all });
    },
  });
}
