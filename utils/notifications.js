// utils/notifications.js
// Helper para notificações locais (status do pedido, alertas, etc)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from './logger';

// Configuração padrão: mostra notificação mesmo com app em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Pede permissão pra notificar (necessário no iOS, recomendado no Android 13+)
export async function requestNotificationPermission() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    logger.log('[TUTTI] permissão atual:', existing);
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    logger.log('[TUTTI] permissão após request:', status);
    return status === 'granted';
  } catch (error) {
    logger.warn('[TUTTI] Erro ao pedir permissão:', error);
    return false;
  }
}

// Cria canais Android (necessário no Android 8+)
// - 'pedidos': mudança de status do pedido (alta prioridade, vibra)
// - 'tutti':   sugestões proativas do assistente (prioridade normal)
export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('pedidos', {
      name: 'Status de pedidos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
      sound: 'default',
    });
    // Canal renomeado pra forçar criação com nova importância
    // (Android não permite alterar importância de canal já existente).
    await Notifications.setNotificationChannelAsync('tutti-suggestions', {
      name: 'Sugestões do Tutti',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#FF6B35',
      sound: 'default',
    });
    // DEBUG: confirma como o canal ficou
    const channels = await Notifications.getNotificationChannelsAsync();
    const tuttiCh = channels.find(c => c.id === 'tutti-suggestions');
    logger.log('[TUTTI] canal tutti-suggestions:', tuttiCh
      ? `importance=${tuttiCh.importance} (HIGH=4, MAX=5)`
      : 'NÃO ENCONTRADO');
  } catch (error) {
    logger.warn('Erro ao criar canais Android:', error);
  }
}

// Dispara uma notificação local imediata. Usa o canal 'pedidos'
// (IMPORTANCE_HIGH) pra aparecer como heads-up sobre a tela em vez de
// só no drawer. Sem o channelId cairia no Default (IMPORTANCE_DEFAULT)
// que não popa banner no Android 8+.
export async function notifyStatusPedido({ title, body, data = {} }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: Platform.OS === 'android'
        ? { channelId: 'pedidos' }
        : null,
    });
  } catch (error) {
    logger.warn('Erro ao disparar notificação:', error);
  }
}

// Notificação de pagamento aprovado — disparada após auto-aprovação
// no fluxo de pagamento. Usa o canal 'pedidos' (HIGH importance) pra aparecer
// como banner sobre a tela. Toque na notif leva pra /orders.
export async function notifyPagamentoAprovado({ valor, metodoPagamento, pagamentoId }) {
  try {
    const valorFormatado = Number(valor || 0).toFixed(2).replace('.', ',');
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💳 Pagamento aprovado!',
        body: `R$ ${valorFormatado} via ${metodoPagamento}. Obrigada pela visita! 🍝`,
        data: { action: 'open_orders', pagamentoId },
        sound: 'default',
      },
      trigger: Platform.OS === 'android'
        ? { channelId: 'pedidos' }
        : null,
    });
    logger.log('[PAGAMENTO] notificação id:', id);
  } catch (error) {
    logger.warn('[PAGAMENTO] Erro ao disparar notificação:', error);
  }
}

// Notificação proativa do Tutti — sugere ajuda quando o usuário fica
// inativo na tela do cardápio. Prioridade normal (não intrusivo).
export async function notifyTuttiProactive() {
  try {
    logger.log('[TUTTI] notifyTuttiProactive: chamando scheduleNotificationAsync');
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🤖 Tutti aqui!',
        body: 'Tá em dúvida do que pedir? Posso te dar umas sugestões 🍝',
        data: { action: 'open_tutti' },
        sound: 'default',
        // Algumas versões do expo-notifications respeitam essa chave
        ...(Platform.OS === 'android' && { channelId: 'tutti-suggestions' }),
      },
      trigger: Platform.OS === 'android'
        ? { channelId: 'tutti-suggestions' }
        : null,
    });
    logger.log('[TUTTI] notification id:', id);
  } catch (error) {
    logger.warn('[TUTTI] Erro ao disparar notificação do Tutti:', error);
  }
}

// Mensagens amigáveis por status
export function getStatusNotification(status, pedidoId) {
  const map = {
    EM_PREPARO: {
      title: 'Pedido em preparo',
      body: `Seu pedido #${pedidoId} foi recebido e já está sendo preparado!`,
    },
    PRONTO: {
      title: 'Pedido pronto!',
      body: `Seu pedido #${pedidoId} está pronto. O garçom vai te servir em instantes.`,
    },
    ENTREGUE: {
      title: 'Pedido entregue',
      body: `Seu pedido #${pedidoId} foi entregue. Aproveite!`,
    },
    CANCELADO: {
      title: 'Pedido cancelado',
      body: `Seu pedido #${pedidoId} foi cancelado.`,
    },
  };
  return map[status] || null;
}
