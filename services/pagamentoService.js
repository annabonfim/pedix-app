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

// Cria pagamento. POST /api/pagamentos espera CriarPagamentoDto no BODY
// (PedidoId Guid, Valor decimal, MetodoPagamento string).
export async function criarPagamento({ valor, metodoPagamento, clienteId, pedidoId }) {
  const finalPedidoId = pedidoId || (await getPedidoIdParaPagar(clienteId));

  return csharpApi.post('/pagamentos', {
    pedidoId: finalPedidoId,
    valor: Number(valor),
    metodoPagamento,
  });
}

// Busca pagamentos de um pedido específico. Pode retornar 0 (sem pagamento),
// 1 (caso normal) ou mais (tentativas anteriores). Usado pra enriquecer o
// histórico de pedidos com método de pagamento (PIX/CREDITO/etc).
export async function fetchPagamentoByPedido(pedidoId) {
  if (!pedidoId) return null;
  try {
    const list = await csharpApi.get(`/pagamentos/pedido/${pedidoId}`);
    if (!Array.isArray(list) || list.length === 0) return null;
    // Pega o APROVADO mais recente; se não tem aprovado, o último que veio.
    const aprovado = list.find((p) => (p.status || '').toUpperCase() === 'APROVADO');
    return aprovado || list[list.length - 1];
  } catch (error) {
    if (error.status === 404) return null;
    logger.warn(`[PAGAMENTO] Erro buscando pagamento do pedido ${pedidoId}:`, error);
    return null;
  }
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
