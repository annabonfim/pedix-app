// hooks/useTuttiProactiveNotification.js
// Dispara uma notificação local do Tutti quando o cliente passa N segundos
// na tela do cardápio sem adicionar nada ao carrinho.
//
// Semântica: "ainda não decidiu o que pedir, deixa o Tutti ajudar".
// Scroll/busca/troca de categoria NÃO resetam o timer — só decidir
// (adicionar item) ou sair da tela cancela.
//
// Dispara uma única vez por sessão do app. Se o cliente esvaziar o
// carrinho depois, não re-arma — Tutti já apareceu, já se ofereceu.

import { useEffect, useRef } from 'react';
import { notifyTuttiProactive } from '../utils/notifications';
import { logger } from '../utils/logger';

const DEFAULT_DELAY_MS = 20_000;

// Flag no escopo do módulo — sobrevive a remounts (cliente sair do cardápio
// e voltar não re-arma o timer). Só zera quando o JS bundle recarrega
// (full app restart / hot reload do Metro). Não usamos AsyncStorage porque
// a regra é "uma vez por sessão do app", não "uma vez por instalação".
let hasFiredThisSession = false;

export function useTuttiProactiveNotification({
  active = true,
  cartEmpty = true,
  delayMs = DEFAULT_DELAY_MS,
} = {}) {
  const timerRef = useRef(null);

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    logger.log('[TUTTI] effect run', { active, cartEmpty, fired: hasFiredThisSession, delayMs });

    // Cliente adicionou item: trava pra sempre nessa sessão, mesmo se esvaziar
    // o carrinho depois — Tutti não precisa mais se oferecer.
    if (!cartEmpty) {
      logger.log('[TUTTI] cartEmpty=false → travando até fim da sessão');
      clear();
      hasFiredThisSession = true;
      return;
    }

    if (!active || hasFiredThisSession) {
      logger.log('[TUTTI] não vai armar — active:', active, 'fired:', hasFiredThisSession);
      clear();
      return;
    }

    clear();
    logger.log(`[TUTTI] armando timer de ${delayMs}ms`);
    timerRef.current = setTimeout(() => {
      logger.log('[TUTTI] timer disparou → chamando notifyTuttiProactive');
      notifyTuttiProactive();
      hasFiredThisSession = true;
      timerRef.current = null;
    }, delayMs);

    return clear;
  }, [active, cartEmpty, delayMs]);
}
