// hooks/usePedidoStatusNotifications.js
// Detecta mudanças de status nos pedidos do cliente e dispara notificação local
import { useEffect, useRef } from 'react';
import { notifyStatusPedido, getStatusNotification } from '../utils/notifications';

export function usePedidoStatusNotifications(pedidos) {
  // Mapa: pedidoId -> último status conhecido
  const lastStatusRef = useRef(new Map());
  // Marca a primeira execução pra não notificar pedidos antigos ao abrir o app
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!Array.isArray(pedidos)) return;

    if (!initializedRef.current) {
      // Primeira leitura: só registra os status atuais sem notificar
      pedidos.forEach((p) => {
        lastStatusRef.current.set(p.id, p.status);
      });
      initializedRef.current = true;
      return;
    }

    pedidos.forEach((pedido) => {
      const previous = lastStatusRef.current.get(pedido.id);
      if (previous && previous !== pedido.status) {
        const msg = getStatusNotification(pedido.status, pedido.id);
        if (msg) {
          notifyStatusPedido({
            ...msg,
            data: { pedidoId: pedido.id, status: pedido.status, action: 'open_orders' },
          });
        }
      }
      lastStatusRef.current.set(pedido.id, pedido.status);
    });
  }, [pedidos]);
}
