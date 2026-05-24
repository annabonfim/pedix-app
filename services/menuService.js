// Serviço para buscar itens do cardápio

import { javaApi } from './javaApi';
import { logger } from '../utils/logger';

// Busca todos os itens do cardápio
// categoria: (opcional) filtra por categoria
export async function fetchMenuItems(categoria = null) {
  try {
    const endpoint = categoria 
      ? `/item-cardapio?categoria=${encodeURIComponent(categoria)}`
      : '/item-cardapio';
    
    const response = await javaApi.get(endpoint);
    
    // API retorna EntityModel ou array de EntityModel (Spring HATEOAS)
    let items = [];
    if (Array.isArray(response)) {
      // Se for array, extrai 'content' de cada EntityModel
      items = response.map((item) => {
        return item.content || item;
      });
    } else if (response.content) {
      // Se for um único EntityModel
      items = [response.content];
    } else if (response._embedded && response._embedded.itemCardapioList) {
      // Formato Spring HATEOAS com _embedded
      items = response._embedded.itemCardapioList;
    } else {
      items = [response];
    }
    
    // Mapeia para o formato da aplicação
    const mapped = items.map((item) => {
      // Usa a imagem do banco, ou emoji padrão se não tiver
      const imageValue = item.imagemUrl || item.image || item.imageUrl || '🍽️';

      // API Azure retorna `categoriaNome` (string em MAIÚSCULO).
      // Fallback pros nomes antigos pra não quebrar nada legado.
      const categoryValue = normalizeCategoria(
        item.categoriaNome || item.categoria || item.category
      );

      return {
        id: String(item.id),
        name: item.nome || item.name || 'Item sem nome',
        price: parseFloat(item.preco || item.price || 0),
        category: categoryValue,
        categoryId: item.categoriaId ?? null,
        description: item.descricao || item.description || '',
        image: imageValue,
        available: item.disponivel !== false && item.available !== false,
      };
    });

    // Dedup: o banco acumulou duplicatas exatas (ex: 12x Cheesecake idênticos
    // criados em testes de POST). Agrupa por nome+categoria+preço e mantém
    // o primeiro id de cada grupo.
    const seen = new Map();
    for (const item of mapped) {
      const key = `${item.name.toLowerCase().trim()}|${item.category}|${item.price.toFixed(2)}`;
      if (!seen.has(key)) seen.set(key, item);
    }
    return Array.from(seen.values());
  } catch (error) {
    logger.error('Erro ao buscar itens do cardápio:', error);
    throw error;
  }
}

// Extrai o item da resposta da API (formato varia entre endpoints)
function parseItemResponse(response) {
  // POST/PUT retornam { mensagem, item, _links }
  const item = response.item || response.content || response;
  return {
    id: String(item.id),
    name: item.nome || item.name || '',
    price: parseFloat(item.preco || item.price || 0),
    category: normalizeCategoria(item.categoriaNome || item.categoria || item.category || 'PRATO'),
    categoryId: item.categoriaId ?? null,
    description: item.descricao || item.description || '',
    image: item.imagemUrl || item.image || '🍽️',
    available: item.disponivel !== false,
  };
}

// Mapeamento estático: nome da categoria (como aparece na UI) → categoriaId
// (FK numérica que a API Java passou a exigir no POST/PUT). As 3 categorias
// "core" do cardápio do squad são fixas (vide config/constants.js).
const CATEGORIA_ID_BY_NAME = {
  PRATO: 1,
  BEBIDA: 2,
  SOBREMESA: 3,
};

// Normaliza nome de categoria pra forma canônica do app (singular MAIÚSCULA).
// A API Java retorna às vezes plural ("BEBIDAS") e às vezes singular,
// dependendo de quem cadastrou. Centraliza aqui pra não espalhar o
// `replace(/S$/)` por todas as telas que filtram/agrupam por categoria.
function normalizeCategoria(raw) {
  if (!raw) return 'Outros';
  return String(raw).toUpperCase().replace(/S$/, '');
}

function resolveCategoriaId(categoryName) {
  if (!categoryName) return null;
  const id = CATEGORIA_ID_BY_NAME[categoryName.toUpperCase()];
  return id || null;
}

// Cria um novo item no cardápio
export async function createMenuItem(itemData) {
  try {
    const payload = {
      nome: itemData.name,
      preco: itemData.price,
      categoria: itemData.category,                  // backwards compat
      categoriaId: resolveCategoriaId(itemData.category), // novo schema Java
      descricao: itemData.description || '',
      disponivel: itemData.available !== false,
      imagemUrl: itemData.image || null,
    };
    const response = await javaApi.post('/item-cardapio', payload);
    return parseItemResponse(response);
  } catch (error) {
    logger.error('Erro ao criar item:', error);
    throw error;
  }
}

// Atualiza um item existente
export async function updateMenuItem(itemId, itemData) {
  try {
    const payload = {
      nome: itemData.name,
      preco: itemData.price,
      categoria: itemData.category,                  // backwards compat
      categoriaId: resolveCategoriaId(itemData.category), // novo schema Java
      descricao: itemData.description || '',
      disponivel: itemData.available !== false,
      imagemUrl: itemData.image || null,
    };
    const response = await javaApi.put(`/item-cardapio/${itemId}`, payload);
    return parseItemResponse(response);
  } catch (error) {
    logger.error(`Erro ao atualizar item ${itemId}:`, error);
    throw error;
  }
}

// Deleta um item do cardápio
export async function deleteMenuItem(itemId) {
  try {
    await javaApi.delete(`/item-cardapio/${itemId}`);
  } catch (error) {
    logger.error(`Erro ao deletar item ${itemId}:`, error);
    throw error;
  }
}

// Busca um item específico por ID
export async function fetchMenuItemById(itemId) {
  try {
    const response = await javaApi.get(`/item-cardapio/${itemId}`);
    
    // Extrai os dados do item da resposta
    const item = response.content || response;

    // Usa a imagem do banco, ou emoji padrão se não tiver
    const imageValue = item.imagemUrl || item.image || item.imageUrl || '🍽️';
    
    return {
      id: String(item.id),
      name: item.nome || item.name || 'Item sem nome',
      price: parseFloat(item.preco || item.price || 0),
      category: normalizeCategoria(item.categoriaNome || item.categoria || item.category || 'Outros'),
      categoryId: item.categoriaId ?? null,
      description: item.descricao || item.description || '',
      image: imageValue,
      available: item.disponivel !== false && item.available !== false,
    };
  } catch (error) {
    logger.error(`Erro ao buscar item ${itemId}:`, error);
    throw error;
  }
}



