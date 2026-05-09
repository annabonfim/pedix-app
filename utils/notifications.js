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
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    logger.warn('Erro ao pedir permissão de notificação:', error);
    return false;
  }
}

// Cria canal Android (necessário no Android 8+)
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
  } catch (error) {
    logger.warn('Erro ao criar canal Android:', error);
  }
}

// Dispara uma notificação local imediata
export async function notifyStatusPedido({ title, body, data = {} }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // imediato
    });
  } catch (error) {
    logger.warn('Erro ao disparar notificação:', error);
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
