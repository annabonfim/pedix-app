// services/relatorioService.js
import { javaApi } from './javaApi';
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

// Remove relatórios duplicados (mesmo tipo + titulo). O banco acumula
// múltiplas execuções de teste do mesmo relatório (ex: "Relatório de vendas
// do dia" gerado 12x). Mantém o mais recente do grupo.
function dedupRelatorios(list) {
  const ordenados = [...list].sort(
    (a, b) => new Date(b.dataGeracao || 0) - new Date(a.dataGeracao || 0)
  );
  const seen = new Map();
  for (const r of ordenados) {
    const key = `${r.tipo}|${r.titulo}`;
    if (!seen.has(key)) seen.set(key, r);
  }
  return Array.from(seen.values());
}

export async function fetchRelatorios() {
  try {
    const response = await javaApi.get('/relatorios');
    const list = Array.isArray(response) ? response : (response._embedded?.relatorioList || []);
    return dedupRelatorios(list.map(parseRelatorio));
  } catch (error) {
    logger.error('Erro ao buscar relatorios:', error);
    throw error;
  }
}

export async function fetchRelatorioById(id) {
  try {
    const response = await javaApi.get(`/relatorios/${id}`);
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
    const response = await javaApi.post('/relatorios', payload);
    return parseRelatorio(response);
  } catch (error) {
    logger.error('Erro ao criar relatorio:', error);
    throw error;
  }
}
