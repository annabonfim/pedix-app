import { useQuery } from '@tanstack/react-query';
import { csharpApi } from '../services/csharpAPi';

export function useMesas() {
  return useQuery({
    queryKey: ['mesas', 'list'],
    queryFn: async () => {
      const res = await csharpApi.get('/mesas');
      return Array.isArray(res) ? res : res?.data || res?.items || [];
    },
    refetchInterval: 30_000,
  });
}
