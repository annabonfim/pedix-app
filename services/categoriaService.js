// services/categoriaService.js
import { javaApi } from './javaApi';
import { logger } from '../utils/logger';

function parseCategoria(item) {
  const c = item?.content || item;
  return {
    id: String(c.id),
    nome: c.nome,
    descricao: c.descricao,
    ativo: c.ativo !== false,
  };
}

export async function fetchCategorias() {
  try {
    const response = await javaApi.get('/categorias-cardapio');
    const list = Array.isArray(response) ? response : (response._embedded?.categoriaCardapioList || []);
    return list.map(parseCategoria);
  } catch (error) {
    logger.error('Erro ao buscar categorias:', error);
    throw error;
  }
}

export async function createCategoria(data) {
  try {
    const response = await javaApi.post('/categorias-cardapio', {
      nome: data.nome,
      descricao: data.descricao || '',
      ativo: data.ativo !== false,
    });
    return parseCategoria(response);
  } catch (error) {
    logger.error('Erro ao criar categoria:', error);
    throw error;
  }
}

export async function updateCategoria(id, data) {
  try {
    const response = await javaApi.put(`/categorias-cardapio/${id}`, {
      nome: data.nome,
      descricao: data.descricao || '',
      ativo: data.ativo !== false,
    });
    return parseCategoria(response);
  } catch (error) {
    logger.error(`Erro ao atualizar categoria ${id}:`, error);
    throw error;
  }
}

export async function deleteCategoria(id) {
  try {
    await javaApi.delete(`/categorias-cardapio/${id}`);
  } catch (error) {
    logger.error(`Erro ao deletar categoria ${id}:`, error);
    throw error;
  }
}
