// hooks/useTutti.js
// Lógica central do chat do Tutti: histórico, envio, retry e auto-reset

import { useState, useCallback, useMemo } from 'react';
import { sendMessage as sendToTutti } from '../services/tuttiService';

// Mensagem de boas-vindas estática (UI-only, NUNCA é enviada para a API)
const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: 'Oi! Sou o Tutti, seu assistente de IA pra recomendações 🍝 Como posso te ajudar hoje?',
  isWelcome: true,
};

// Mensagem injetada quando o limite de 20 turnos reais é atingido
const AUTO_RESET_TEXT =
  'Nossa conversa ficou longa! Vou começar uma nova pra continuar te ajudando 😊';

// Mensagem mostrada quando a API falha
const ERROR_TEXT = 'Ops, tive um problema. Pode tentar de novo? 🙏';

// Limite do backend (Pydantic validator max_length=20 na lista messages)
const MAX_REAL_MESSAGES = 20;

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// "Real message" = turno user/assistant que conta no limite de 20 do backend.
// Welcome, auto-reset e error bubbles são UI-only.
function isRealMessage(m) {
  return !m.isWelcome && !m.isAutoReset && !m.isError;
}

function toApiPayload(messages) {
  return messages
    .filter(isRealMessage)
    .map(({ role, content }) => ({ role, content }));
}

// Marca a última user message como "failed" (UI mostra botão "Tentar novamente")
function markLastUserFailed(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && isRealMessage(messages[i])) {
      return messages.map((m, idx) =>
        idx === i ? { ...m, failed: true } : m
      );
    }
  }
  return messages;
}

// Remove bolha de erro e tira flag "failed" de qualquer user message
function clearErrorState(messages) {
  return messages
    .filter((m) => !m.isError)
    .map((m) => (m.failed ? { ...m, failed: false } : m));
}

export function useTutti() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);

  // Chips só aparecem antes da primeira interação do usuário.
  // Derivado do estado: enquanto o histórico for só o welcome, mostra chips.
  const chipsVisible = useMemo(
    () => messages.length === 1 && messages[0]?.isWelcome === true,
    [messages]
  );

  // True assim que o usuário envia a primeira mensagem (digitando ou via chip).
  // Usado pelo modal pra esconder o welcome banner.
  const hasUserInteracted = useMemo(
    () => messages.some((m) => m.role === 'user'),
    [messages]
  );

  const sendMessage = useCallback(
    async (rawText) => {
      const text = (rawText || '').trim();
      if (!text || loading) return;

      // Limpa estado de erro caso o usuário esteja digitando algo novo
      // (em vez de clicar em retry)
      const cleaned = clearErrorState(messages);
      const realCount = cleaned.filter(isRealMessage).length;
      const userMsg = { id: genId(), role: 'user', content: text };

      let nextMessages;
      let payload;

      if (realCount >= MAX_REAL_MESSAGES) {
        // Atingiu o limite: reseta histórico mas preserva a mensagem do usuário
        const resetMsg = {
          id: genId(),
          role: 'assistant',
          content: AUTO_RESET_TEXT,
          isAutoReset: true,
        };
        nextMessages = [WELCOME_MESSAGE, resetMsg, userMsg];
        payload = [{ role: 'user', content: text }];
      } else {
        nextMessages = [...cleaned, userMsg];
        payload = toApiPayload(nextMessages);
      }

      setMessages(nextMessages);
      setLoading(true);

      try {
        const response = await sendToTutti(payload);
        setMessages((prev) => [
          ...prev,
          { id: genId(), role: 'assistant', content: response.recommendation },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...markLastUserFailed(prev),
          {
            id: genId(),
            role: 'assistant',
            content: ERROR_TEXT,
            isError: true,
            errorCode: error?.code,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages]
  );

  const retry = useCallback(async () => {
    if (loading) return;
    if (!messages.some((m) => m.failed)) return;

    const cleaned = clearErrorState(messages);
    setMessages(cleaned);

    const payload = toApiPayload(cleaned);
    setLoading(true);

    try {
      const response = await sendToTutti(payload);
      setMessages((prev) => [
        ...prev,
        { id: genId(), role: 'assistant', content: response.recommendation },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...markLastUserFailed(prev),
        {
          id: genId(),
          role: 'assistant',
          content: ERROR_TEXT,
          isError: true,
          errorCode: error?.code,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const reset = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  return {
    messages,
    chipsVisible,
    hasUserInteracted,
    loading,
    sendMessage,
    retry,
    reset,
  };
}
