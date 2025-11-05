// Serviço para buscar itens do cardápio

import { api } from './api';
import { getItemEmoji } from '../config/emojiMap';

// Busca todos os itens do cardápio
// categoria: (opcional) filtra por categoria
export async function fetchMenuItems(categoria = null) {
  try {
    const endpoint = categoria 
      ? `/item-cardapio?categoria=${encodeURIComponent(categoria)}`
      : '/item-cardapio';
    
    const response = await api.get(endpoint);
    
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
    return items.map((item) => {
      // Prioridade: usar diretamente o que vem do banco (imagemUrl)
      const imagemUrl = item.imagemUrl || item.image || item.imageUrl || null;
      
      let imageValue;
      if (imagemUrl) {
        // Se tem imagemUrl no banco, usa ela (pode ser URL ou emoji)
        imageValue = imagemUrl;
      } else {
        // Se não tem imagemUrl, usa emojiMap como fallback
        const emoji = getItemEmoji(item);
        imageValue = emoji || '🍽️';
      }
      
      return {
        id: String(item.id),
        name: item.nome || item.name || 'Item sem nome',
        price: parseFloat(item.preco || item.price || 0),
        category: item.categoria || item.category || 'Outros',
        description: item.descricao || item.description || '',
        image: imageValue,
        available: item.disponivel !== false && item.available !== false,
      };
    });
  } catch (error) {
    console.error('Erro ao buscar itens do cardápio:', error);
    throw error;
  }
}

// Busca um item específico por ID
export async function fetchMenuItemById(itemId) {
  try {
    const response = await api.get(`/item-cardapio/${itemId}`);
    
    // EntityModel tem 'content' com os dados reais
    const item = response.content || response;
    
    // Prioridade: usar diretamente o que vem do banco (imagemUrl)
    const imagemUrl = item.imagemUrl || item.image || item.imageUrl || null;
    
    let imageValue;
    if (imagemUrl) {
      // Se tem imagemUrl no banco, usa ela (pode ser URL ou emoji)
      imageValue = imagemUrl;
    } else {
      // Se não tem imagemUrl, usa emojiMap como fallback
      const emoji = getItemEmoji(item);
      imageValue = emoji || '🍽️';
    }
    
    return {
      id: String(item.id),
      name: item.nome || item.name || 'Item sem nome',
      price: parseFloat(item.preco || item.price || 0),
      category: item.categoria || item.category || 'Outros',
      description: item.descricao || item.description || '',
      image: imageValue,
      available: item.disponivel !== false && item.available !== false,
    };
  } catch (error) {
    console.error(`Erro ao buscar item ${itemId}:`, error);
    throw error;
  }
}

// Agrupa os itens por categoria (ex: Pratos, Bebidas, etc)
export function groupItemsByCategory(items) {
  const grouped = {};
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const category = item.category || 'Outros';
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push(item);
  }
  
  return grouped;
}

