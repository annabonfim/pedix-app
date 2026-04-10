// Serviço para gerenciar pedidos

import { api } from './api';
import { logger } from '../utils/logger';

// Cria um novo pedido vinculado a uma comanda
// comandaId: número da mesa/comanda
// items: array com os itens do pedido { id, quantity }
// observacao: observação opcional do pedido
export async function createPedido(comandaId, items, observacao = '') {
  try {
    const pedidoDTO = {
      itens: items.map((item) => ({
        itemCardapioId: parseInt(item.id, 10),
        quantidade: item.quantity || 1,
      })),
      observacao: observacao || null,
    };

    logger.log('📤 Enviando pedido:', {
      comandaId,
      endpoint: `/pedido/comanda/${comandaId}`,
      payload: pedidoDTO,
      itemsCount: items.length,
    });

    const response = await api.post(`/pedido/comanda/${comandaId}`, pedidoDTO);
    
    logger.log('✅ Resposta da API:', response);
    
    // A API retorna EntityModel com 'pedido' ou 'content'
    const pedido = response.pedido || response.content || response;
    
    return pedido;
  } catch (error) {
    logger.error('Erro ao criar pedido:', error);
    throw error;
  }
}

// Busca todos os pedidos de uma comanda específica
export async function fetchPedidosByComanda(comandaId) {
  try {
    const response = await api.get(`/pedido/comanda/${comandaId}`);
    
    // API pode retornar array direto ou array de EntityModel
    let pedidos = [];
    
    if (Array.isArray(response)) {
      // Extrai content de cada EntityModel se necessário
      pedidos = response.map((item) => {
        return item.content || item;
      });
    } else if (response.content) {
      // Se for um único EntityModel
      pedidos = [response.content];
    }
    
    return pedidos;
  } catch (error) {
    logger.error(`Erro ao buscar pedidos da comanda ${comandaId}:`, error);
    throw error;
  }
}

// Busca um pedido específico por ID
export async function fetchPedidoById(pedidoId) {
  try {
    const response = await api.get(`/pedido/${pedidoId}`);
    
    // EntityModel tem 'content' com os dados reais
    const pedido = response.content || response;
    
    return pedido;
  } catch (error) {
    logger.error(`Erro ao buscar pedido ${pedidoId}:`, error);
    throw error;
  }
}

// Atualiza o status de um pedido
// pedidoId: ID do pedido
// status: 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'
// Precisa buscar o pedido primeiro pra mandar os itens junto (API exige)
export async function atualizarStatusPedido(pedidoId, status) {
  try {
    // Busca pedido atual pra pegar os itens
    const pedidoAtual = await fetchPedidoById(pedidoId);

    const pedidoDTO = {
      itens: (pedidoAtual.itens || []).map((item) => ({
        itemCardapioId: item.itemCardapioId,
        quantidade: item.quantidade || 1,
      })),
      observacao: pedidoAtual.observacao || null,
      status: status,
    };

    const response = await api.put(`/pedido/${pedidoId}`, pedidoDTO);
    const pedido = response.pedido || response.content || response;

    return pedido;
  } catch (error) {
    logger.error(`Erro ao atualizar status do pedido ${pedidoId}:`, error);
    throw error;
  }
}

// Atualiza um pedido existente
// pedidoId: ID do pedido a ser atualizado
// comandaId: número da mesa/comanda
// items: array com os itens do pedido { id, quantity }
// observacao: observação opcional do pedido
export async function atualizarPedido(pedidoId, comandaId, items, observacao = '') {
  try {
    const pedidoDTO = {
      itens: items.map((item) => ({
        itemCardapioId: parseInt(item.id, 10),
        quantidade: item.quantity || 1,
      })),
      observacao: observacao || null,
    };

    logger.log('🔄 Atualizando pedido:', {
      pedidoId,
      comandaId,
      endpoint: `/pedido/${pedidoId}`,
      payload: pedidoDTO,
    });

    // Tenta atualizar usando PUT endpoint (agora disponível na API)
    try {
      const response = await api.put(`/pedido/${pedidoId}`, pedidoDTO);
      const pedido = response.pedido || response.content || response;
      logger.log('✅ Pedido atualizado com sucesso:', pedido);
      return pedido;
    } catch (putError) {
      // Se PUT não funcionar, usa fallback: cancela e recria
      logger.warn('⚠️ PUT falhou, usando fallback (cancelar e recriar)...', putError);
      
      if (putError.status === 404 || putError.status === 405 || putError.status >= 500) {
        // Cancela pedido antigo
        try {
          await atualizarStatusPedido(pedidoId, 'CANCELADO');
        } catch (cancelError) {
          logger.warn('Aviso ao cancelar pedido antigo:', cancelError);
          // Continua mesmo se der erro ao cancelar
        }
        
        // Cria novo pedido com os dados atualizados
        const novoPedido = await createPedido(comandaId, items, observacao);
        logger.log('✅ Pedido atualizado (recriado) com sucesso:', novoPedido);
        return novoPedido;
      }
      // Se for outro erro (400, 401, 403), propaga o erro
      throw putError;
    }
  } catch (error) {
    logger.error(`Erro ao atualizar pedido ${pedidoId}:`, error);
    throw error;
  }
}

// Deleta um pedido (cancela o pedido)
// pedidoId: ID do pedido a ser deletado
export async function deletarPedido(pedidoId) {
  try {
    // Tenta deletar usando DELETE endpoint
    try {
      await api.delete(`/pedido/${pedidoId}`);
      return { success: true, message: 'Pedido cancelado com sucesso' };
    } catch (deleteError) {
      // Se DELETE não existir, cancela mudando status para CANCELADO
      if (deleteError.status === 404 || deleteError.status === 405) {
        const response = await atualizarStatusPedido(pedidoId, 'CANCELADO');
        return { success: true, message: 'Pedido cancelado com sucesso', pedido: response };
      }
      throw deleteError;
    }
  } catch (error) {
    logger.error(`Erro ao deletar pedido ${pedidoId}:`, error);
    throw error;
  }
}


