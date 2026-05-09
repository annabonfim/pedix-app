// services/relatorioService.js
import { api } from './api';
import { logger } from '../utils/logger';

function parseRelatorio(item) {
  const r = item?.content || item;
  return {
    id: String(r.id),
    tipo: r.tipo,
    titulo: r.titulo,
    descricao: r.descricao,
    valorTotal: parseFloat(r.valorTotal || 0),
    quantidade: r.quantidade || 0,
    dataGeracao: r.dataGeracao,
    responsavel: r.responsavel,
  };
}

export async function fetchRelatorios() {
  try {
    const response = await api.get('/relatorios');
    const list = Array.isArray(response) ? response : (response._embedded?.relatorioList || []);
    return list.map(parseRelatorio);
  } catch (error) {
    logger.error('Erro ao buscar relatorios:', error);
    throw error;
  }
}

export async function fetchRelatorioById(id) {
  try {
    const response = await api.get(`/relatorios/${id}`);
    return parseRelatorio(response);
  } catch (error) {
    logger.error(`Erro ao buscar relatorio ${id}:`, error);
    throw error;
  }
}

export async function createRelatorio(data) {
  try {
    const payload = {
      tipo: data.tipo,
      titulo: data.titulo,
      descricao: data.descricao,
      valorTotal: data.valorTotal,
      quantidade: data.quantidade,
      responsavel: data.responsavel,
    };
    const response = await api.post('/relatorios', payload);
    return parseRelatorio(response);
  } catch (error) {
    logger.error('Erro ao criar relatorio:', error);
    throw error;
  }
}
