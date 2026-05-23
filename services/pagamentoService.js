// Pagamentos via API .NET.
// O endpoint POST /api/pagamentos espera pedidoId (Guid). Como agora os
// pedidos são da própria C#, usamos o id real de um pedido aberto do cliente.

import { csharpApi } from './csharpAPi';
import { fetchPedidosByCliente } from './pedidoService';
import { logger } from '../utils/logger';

// Pega o último pedido em aberto do cliente (mais recente, não cancelado).
// Necessário porque o Pagamento referencia 1 pedido (modelo atual da API).
async function getPedidoIdParaPagar(clienteId) {
  if (!clienteId) throw new Error('Cliente não autenticado.');
  const pedidos = await fetchPedidosByCliente(clienteId);
  const abertos = pedidos.filter(
    (p) => (p.status || '').toUpperCase() !== 'CANCELADO'
  );
  if (!abertos.length) {
    throw new Error('Nenhum pedido em aberto pra pagar.');
  }
  // Mais recente primeiro
  abertos.sort((a, b) => new Date(b.dataPedido || 0) - new Date(a.dataPedido || 0));
  return abertos[0].id;
}

// Cria pagamento. Usa query string (estilo que a Duda já usa na API).
export async function criarPagamento({ valor, metodoPagamento, clienteId, pedidoId }) {
  const finalPedidoId = pedidoId || (await getPedidoIdParaPagar(clienteId));

  const qs = new URLSearchParams({
    pedidoId: finalPedidoId,
    valor: String(valor),
    metodoPagamento,
  }).toString();

  return csharpApi.post(`/pagamentos?${qs}`, null);
}

// Aprova pagamento (auto, ~2-3s após criar).
// Se o endpoint ainda não estiver no deploy, falha silencioso e segue.
export async function aprovarPagamento(id) {
  try {
    return await csharpApi.put(`/pagamentos/${id}/aprovar`, null);
  } catch (error) {
    if (error.status === 404 || error.status === 405) {
      logger.warn('[PAGAMENTO] /aprovar não disponível — simulando aprovação local');
      return { id, status: 'APROVADO', _simulado: true };
    }
    throw error;
  }
}
