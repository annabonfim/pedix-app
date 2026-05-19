// hooks/useTuttiProactiveNotification.js
// Dispara uma notificação local do Tutti quando o usuário fica inativo
// na tela do cardápio por mais de N segundos (default 20s).
// Dispara uma única vez por sessão (enquanto o hook estiver montado).

import { useEffect, useRef, useCallback } from 'react';
import { notifyTuttiProactive } from '../utils/notifications';

const DEFAULT_DELAY_MS = 20_000;

export function useTuttiProactiveNotification({
  active = true,
  delayMs = DEFAULT_DELAY_MS,
} = {}) {
  // ID do setTimeout em execução (pra poder cancelar quando o usuário interage)
  const timerRef = useRef(null);
  // Trava de "uma vez por sessão" — depois que disparar, não re-arma o timer
  const firedRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  const startTimer = useCallback(() => {
    clearTimer();
    if (firedRef.current) return;
    timerRef.current = setTimeout(() => {
      notifyTuttiProactive();
      firedRef.current = true;
      timerRef.current = null;
    }, delayMs);
  }, [delayMs]);

  // Quando o usuário faz qualquer interação no cardápio, reseta o timer
  const registerInteraction = useCallback(() => {
    if (!active || firedRef.current) return;
    startTimer();
  }, [active, startTimer]);

  // Liga/desliga o timer conforme a tela está ativa (focada) ou não
  useEffect(() => {
    if (!active) {
      clearTimer();
      return;
    }
    if (!firedRef.current) {
      startTimer();
    }
    return clearTimer;
  }, [active, startTimer]);

  return { registerInteraction };
}
