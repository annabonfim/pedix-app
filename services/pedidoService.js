// Serviço para gerenciar pedidos via API .NET (C#).
//
// Fluxo de criação:
//   1. POST /api/pedidos?clienteId=X&garcomId=Y&mesaId=Z → cria pedido vazio
//   2. POST /api/pedido-itens × N → adiciona cada item (com itemCardapioId do Java)
//
// IDs:
//   - clienteId: vem do JWT (user.id do AuthContext)
//   - garcomId: helper getDefaultGarcomId() pega o 1º garçom da lista
//   - mesaId: salvo em AsyncStorage quando o cliente escolhe mesa (mesa:id)
//   - itemCardapioId: ID do item no cardápio Java (int)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { csharpApi } from './csharpAPi';
import { APP_CONFIG } from '../config/constants';
import { logger } from '../utils/logger';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Fallback usado se GET /garcons falhar (defensive). Aponta pro garçom
// "Carlos" cadastrado no banco local da Anna na tabela GARCONS.
const FALLBACK_GARCOM_ID = '2f4773ab-93ca-4f29-b454-fc0747fdf771';

let _cachedGarcomId = null;
export async function getDefaultGarcomId() {
  if (_cachedGarcomId) return _cachedGarcomId;
  try {
    const garcons = await csharpApi.get('/garcons');
    const lista = Array.isArray(garcons) ? garcons : garcons?.data || [];
    const ativo = lista.find((g) => g.ativo !== false) || lista[0];
    if (ativo?.id) {
      _cachedGarcomId = ativo.id;
      return _cachedGarcomId;
    }
  } catch (error) {
    logger.warn('[PEDIDO] GET /garcons falhou — usando garcomId fallback');
  }
  _cachedGarcomId = FALLBACK_GARCOM_ID;
  return _cachedGarcomId;
}

// Resolve o mesaId (Guid) que tá salvo no storage quando o cliente escolheu mesa.
async function getStoredMesaId() {
  const id = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.MESA_ID);
  if (!id) {
    throw new Error('Mesa não selecionada. Volte e escaneie/informe uma mesa.');
  }
  return id;
}

// ─── CRIAR PEDIDO ─────────────────────────────────────────────────────────────
// items: array com { id (do cardápio Java, int), price, quantity }
// clienteId: vem do AuthContext, obrigatório
export async function createPedido(clienteId, items, observacao = '') {
  try {
    if (!clienteId) throw new Error('Cliente não autenticado.');
    if (!items?.length) throw new Error('Pedido sem itens.');

    const mesaId = await getStoredMesaId();
    const garcomId = await getDefaultGarcomId();

    logger.log('📤 Criando pedido C#', { clienteId, garcomId, mesaId, itens: items.length });

    // 1) Cria o pedido vazio
    const qsPedido = new URLSearchParams({ clienteId, garcomId, mesaId }).toString();
    const pedido = await csharpApi.post(`/pedidos?${qsPedido}`, null);

    if (!pedido?.id) {
      throw new Error('API não retornou id do pedido.');
    }

    // 2) Adiciona cada item (serial pra evitar race condition no DB).
    //    Se qualquer um falhar, tenta rollback: marca o pedido como CANCELADO
    //    pra não deixar um esqueleto ABERTO + 0 itens poluindo o histórico
    //    (a API não tem DELETE de pedido — soft delete via status).
    try {
      for (const item of items) {
        const itemCardapioId = parseInt(item.id, 10);
        const quantidade = item.quantity || 1;
        const precoMomento = Number(item.price || 0);
        const qsItem = new URLSearchParams({
          pedidoId: pedido.id,
          itemCardapioId: String(itemCardapioId),
          quantidade: String(quantidade),
          precoMomento: String(precoMomento),
        }).toString();
        await csharpApi.post(`/pedido-itens?${qsItem}`, null);
      }
    } catch (itemError) {
      logger.warn('⚠️ Falha adicionando itens, fazendo rollback do pedido:', pedido.id);
      try {
        await csharpApi.put(`/pedidos/${pedido.id}/status`, { status: 'CANCELADO' });
      } catch (rollbackError) {
        logger.error('Rollback também falhou:', rollbackError);
      }
      throw itemError;
    }

    logger.log('✅ Pedido criado:', pedido.id);
    return pedido;
  } catch (error) {
    logger.error('Erro ao criar pedido:', error);
    throw error;
  }
}

// ─── BUSCAR PEDIDOS DO CLIENTE ────────────────────────────────────────────────
// Retorna lista de pedidos do cliente atual, com items carregados (1 chamada extra por pedido).
export async function fetchPedidosByCliente(clienteId) {
  if (!clienteId) return [];
  try {
    const pedidos = await csharpApi.get(`/pedidos/cliente/${clienteId}`);
    const lista = Array.isArray(pedidos) ? pedidos : [];

    // Pra cada pedido, busca os items
    const comItens = await Promise.all(
      lista.map(async (p) => {
        const itens = await fetchItensByPedido(p.id);
        return mapPedidoFromCSharp(p, itens);
      })
    );
    return comItens;
  } catch (error) {
    logger.error(`Erro ao buscar pedidos do cliente ${clienteId}:`, error);
    throw error;
  }
}

// ─── BUSCAR TODOS OS PEDIDOS ──────────────────────────────────────────────────
// Usado pelo dashboard de mesas pra mostrar preview do que cada mesa tem.
export async function fetchAllPedidos() {
  try {
    const pedidos = await csharpApi.get('/pedidos');
    const lista = Array.isArray(pedidos) ? pedidos : [];
    const comItens = await Promise.all(
      lista.map(async (p) => {
        const itens = await fetchItensByPedido(p.id);
        return mapPedidoFromCSharp(p, itens);
      })
    );
    return comItens;
  } catch (error) {
    logger.error('Erro ao buscar todos os pedidos:', error);
    throw error;
  }
}

// ─── BUSCAR PEDIDOS POR MESA ──────────────────────────────────────────────────
export async function fetchPedidosByMesa(mesaId) {
  if (!mesaId) return [];
  try {
    const pedidos = await csharpApi.get(`/pedidos/mesa/${mesaId}`);
    const lista = Array.isArray(pedidos) ? pedidos : [];
    const comItens = await Promise.all(
      lista.map(async (p) => {
        const itens = await fetchItensByPedido(p.id);
        return mapPedidoFromCSharp(p, itens);
      })
    );
    return comItens;
  } catch (error) {
    logger.error(`Erro ao buscar pedidos da mesa ${mesaId}:`, error);
    throw error;
  }
}

// ─── BUSCAR ITENS DE UM PEDIDO ────────────────────────────────────────────────
export async function fetchItensByPedido(pedidoId) {
  try {
    const itens = await csharpApi.get(`/pedido-itens/pedido/${pedidoId}`);
    return Array.isArray(itens) ? itens : [];
  } catch (error) {
    logger.warn(`Erro ao buscar itens do pedido ${pedidoId}:`, error);
    return [];
  }
}

// ─── BUSCAR PEDIDO POR ID ─────────────────────────────────────────────────────
export async function fetchPedidoById(pedidoId) {
  try {
    const pedido = await csharpApi.get(`/pedidos/${pedidoId}`);
    const itens = await fetchItensByPedido(pedidoId);
    return mapPedidoFromCSharp(pedido, itens);
  } catch (error) {
    logger.error(`Erro ao buscar pedido ${pedidoId}:`, error);
    throw error;
  }
}

// ─── ATUALIZAR STATUS ─────────────────────────────────────────────────────────
// status: 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO'
export async function atualizarStatusPedido(pedidoId, status) {
  try {
    return await csharpApi.put(`/pedidos/${pedidoId}/status`, { status });
  } catch (error) {
    logger.error(`Erro ao atualizar status do pedido ${pedidoId}:`, error);
    throw error;
  }
}

// ─── DELETAR / CANCELAR PEDIDO ────────────────────────────────────────────────
// Não tem DELETE no contrato — soft delete via status=CANCELADO.
export async function deletarPedido(pedidoId) {
  return atualizarStatusPedido(pedidoId, 'CANCELADO');
}

// ─── ATUALIZAR PEDIDO (cancela + recria) ──────────────────────────────────────
// Como a API não tem PUT pedido, "editar" = cancelar antigo + criar novo.
export async function atualizarPedido(pedidoId, clienteId, items, observacao = '') {
  try {
    await atualizarStatusPedido(pedidoId, 'CANCELADO');
    return await createPedido(clienteId, items, observacao);
  } catch (error) {
    logger.error(`Erro ao atualizar pedido ${pedidoId}:`, error);
    throw error;
  }
}

// ─── MAPPING C# → shape esperado pelo app ─────────────────────────────────────
// O app antigo (Java) usava: id (int), dataCriacao, total, itens[].nomeProduto.
// O C# usa: id (Guid), dataPedido, valorTotal, itens vêm separados.
// Mapeamos pra um shape único pra orders.jsx não precisar mudar muito.
function mapPedidoFromCSharp(pedido, itens) {
  const itensFmt = itens.map((it) => ({
    id: it.id,
    itemCardapioId: it.itemCardapioId,
    quantidade: it.quantidade,
    precoUnitario: parseFloat(it.precoMomento || 0),
    subtotal: parseFloat(it.subtotal || it.precoMomento * it.quantidade || 0),
    // nomeProduto fica vazio aqui — UI vai lookup no cardápio se quiser mostrar
    nomeProduto: null,
  }));

  const total = itensFmt.reduce((s, i) => s + i.subtotal, 0);

  return {
    id: pedido.id,
    clienteId: pedido.clienteId,
    garcomId: pedido.garcomId,
    mesaId: pedido.mesaId,
    dataCriacao: pedido.dataPedido, // alias pro nome antigo
    dataPedido: pedido.dataPedido,
    total,                          // alias pro nome antigo
    valorTotal: total,
    status: pedido.status || 'ABERTO',
    itens: itensFmt,
    observacao: '',                 // C# não tem campo observacao
  };
}
