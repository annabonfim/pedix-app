import { useQuery } from '@tanstack/react-query';
import { csharpApi } from '../services/csharpAPi';

// Enum MesaStatus do .NET vem como número. Mapeia pra string ("LIVRE", "OCUPADA").
const STATUS_MAP = {
  0: 'LIVRE',
  1: 'OCUPADA',
  2: 'AGUARDANDO_ATENDIMENTO',
};

function mapMesa(raw) {
  return {
    ...raw,
    status: typeof raw.status === 'number' ? STATUS_MAP[raw.status] || '' : raw.status,
  };
}

export function useMesas() {
  return useQuery({
    queryKey: ['mesas', 'list'],
    queryFn: async () => {
      const res = await csharpApi.get('/mesas');
      const list = Array.isArray(res) ? res : res?.data || res?.items || [];
      return list.map(mapMesa);
    },
    refetchInterval: 30_000,
  });
}
