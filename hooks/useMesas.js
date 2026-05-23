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
    // Dashboard de mesas é o painel "ao vivo" do garçom — vale poll
    // mais frequente pra status mudar em segundos quando cliente cria pedido
    // ou paga conta. 5s alinha com useAllPedidos pra atualização coerente.
    refetchInterval: 5_000,
    staleTime: 0,
  });
}
