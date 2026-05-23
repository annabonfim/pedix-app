// services/avaliacaoService.js
import { javaApi } from './javaApi';
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

// Remove avaliações duplicadas (mesmo nomeCliente + nota + comentário).
// O banco tem múltiplas avaliações idênticas vindas de testes anteriores e a
// API Java exige auth pra DELETE (que o javaApi.js não envia hoje), então o
// filtro fica aqui no front. Mantém a mais recente do grupo.
function dedupAvaliacoes(list) {
  const ordenadas = [...list].sort(
    (a, b) => new Date(b.dataAvaliacao || 0) - new Date(a.dataAvaliacao || 0)
  );
  const seen = new Map();
  for (const av of ordenadas) {
    const key = `${av.nomeCliente}|${av.nota}|${(av.comentario || '').trim()}`;
    if (!seen.has(key)) seen.set(key, av);
  }
  return Array.from(seen.values());
}

export async function fetchAvaliacoes() {
  try {
    const response = await javaApi.get('/avaliacoes');
    const list = Array.isArray(response) ? response : (response._embedded?.avaliacaoList || []);
    return dedupAvaliacoes(list.map(parseAvaliacao));
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
    const response = await javaApi.post('/avaliacoes', payload);
    return parseAvaliacao(response);
  } catch (error) {
    logger.error('Erro ao criar avaliacao:', error);
    throw error;
  }
}

export async function deleteAvaliacao(id) {
  try {
    await javaApi.delete(`/avaliacoes/${id}`);
  } catch (error) {
    logger.error(`Erro ao deletar avaliacao ${id}:`, error);
    throw error;
  }
}
