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

// Filtra categorias geradas em testes de dev/QA que ficaram no banco.
// Padrões observados: "teste", "QA_TESTE_xxx", nomes com sufixo numérico
// timestamp tipo "LANCHES_EXECUTIVOS_1779571288".
function isJunkCategoria(nome) {
  if (!nome) return true;
  const n = String(nome).trim();
  if (/teste/i.test(n)) return true;        // teste, TESTE, _teste_
  if (/^qa[_-]/i.test(n)) return true;      // QA_xxx, qa-xxx
  if (/_\d{6,}$/.test(n)) return true;      // ..._1779571288 (timestamps)
  return false;
}

export async function fetchCategorias() {
  try {
    const response = await javaApi.get('/categorias-cardapio');
    const list = Array.isArray(response) ? response : (response._embedded?.categoriaCardapioList || []);
    return list.map(parseCategoria).filter((c) => !isJunkCategoria(c.nome));
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
