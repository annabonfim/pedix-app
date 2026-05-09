// services/avaliacaoService.js
import { api } from './api';
import { logger } from '../utils/logger';

function parseAvaliacao(item) {
  const a = item?.content || item;
  return {
    id: String(a.id),
    pedidoId: a.pedidoId,
    itemCardapioId: a.itemCardapioId,
    nomeCliente: a.nomeCliente,
    nota: a.nota,
    comentario: a.comentario,
    dataAvaliacao: a.dataAvaliacao,
  };
}

export async function fetchAvaliacoes() {
  try {
    const response = await api.get('/avaliacoes');
    const list = Array.isArray(response) ? response : (response._embedded?.avaliacaoList || []);
    return list.map(parseAvaliacao);
  } catch (error) {
    logger.error('Erro ao buscar avaliacoes:', error);
    throw error;
  }
}

export async function createAvaliacao(data) {
  try {
    const payload = {
      pedidoId: data.pedidoId,
      itemCardapioId: data.itemCardapioId,
      nomeCliente: data.nomeCliente,
      nota: data.nota,
      comentario: data.comentario || '',
    };
    const response = await api.post('/avaliacoes', payload);
    return parseAvaliacao(response);
  } catch (error) {
    logger.error('Erro ao criar avaliacao:', error);
    throw error;
  }
}

export async function deleteAvaliacao(id) {
  try {
    await api.delete(`/avaliacoes/${id}`);
  } catch (error) {
    logger.error(`Erro ao deletar avaliacao ${id}:`, error);
    throw error;
  }
}
