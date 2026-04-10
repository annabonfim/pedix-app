import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useMesas() {
  return useQuery({
    queryKey: ['mesas', 'list'],
    queryFn: async () => {
      const res = await api.get('/mesas');
      return Array.isArray(res) ? res : res?.data || res?.items || [];
    },
    refetchInterval: 30_000,
  });
}
