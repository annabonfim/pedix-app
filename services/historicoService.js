// services/historicoService.js
import { api } from './api';
import { logger } from '../utils/logger';

function parseHistorico(item) {
  const h = item?.content || item;
  return {
    id: String(h.id),
    pedidoId: h.pedidoId,
    statusAnterior: h.statusAnterior,
    statusNovo: h.statusNovo,
    descricao: h.descricao,
    dataRegistro: h.dataRegistro,
    usuario: h.usuario,
  };
}

export async function fetchHistoricos() {
  try {
    const response = await api.get('/historicos-pedidos');
    const list = Array.isArray(response) ? response : (response._embedded?.historicoPedidoList || []);
    return list.map(parseHistorico);
  } catch (error) {
    logger.error('Erro ao buscar histórico:', error);
    throw error;
  }
}

export async function fetchHistoricoByPedido(pedidoId) {
  try {
    const response = await api.get(`/historicos-pedidos/pedido/${pedidoId}`);
    const list = Array.isArray(response) ? response : (response._embedded?.historicoPedidoList || []);
    return list.map(parseHistorico);
  } catch (error) {
    logger.error(`Erro ao buscar histórico do pedido ${pedidoId}:`, error);
    throw error;
  }
}
