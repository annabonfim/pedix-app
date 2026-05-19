// services/tuttiService.js
// Cliente HTTP do assistente de IA "Tutti" (deploy próprio no Azure)

import { logger } from '../utils/logger';

const TUTTI_BASE_URL = 'https://tutti-ai-pedix.azurewebsites.net';
const TUTTI_ENDPOINT = '/recommend';

// Códigos de erro padronizados pra UI tratar de forma amigável
export const TUTTI_ERROR_CODES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',     // 422
  LLM_FAILURE: 'LLM_FAILURE',   // 500
  MENU_API_FAILURE: 'MENU_API_FAILURE', // 502
  UNKNOWN: 'UNKNOWN',
};

// Erro tipado pra que a UI saiba qual mensagem mostrar
class TuttiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'TuttiError';
  }
}

// Envia o histórico de conversa pro endpoint /recommend
// messages: [{role: 'user' | 'assistant', content: string}, ...]
// retorna: {recommendation, menu_size, ratings_considered}
export async function sendMessage(messages) {
  const url = `${TUTTI_BASE_URL}${TUTTI_ENDPOINT}`;
  logger.log(`🤖 POST ${url}`, { count: messages.length });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const status = response.status;
      let code = TUTTI_ERROR_CODES.UNKNOWN;
      if (status === 422) code = TUTTI_ERROR_CODES.VALIDATION;
      else if (status === 500) code = TUTTI_ERROR_CODES.LLM_FAILURE;
      else if (status === 502) code = TUTTI_ERROR_CODES.MENU_API_FAILURE;

      logger.warn(`🤖 Tutti respondeu ${status}`);
      throw new TuttiError(code, `Tutti API retornou ${status}`);
    }

    const data = await response.json();
    logger.log('🤖 Tutti respondeu com sucesso');
    return data;
  } catch (error) {
    if (error instanceof TuttiError) {
      throw error;
    }

    // fetch falhou antes de chegar no servidor (sem internet, DNS, etc)
    logger.error('🤖 Erro de rede ao chamar Tutti:', error);
    throw new TuttiError(
      TUTTI_ERROR_CODES.NETWORK,
      'Não foi possível conectar com o Tutti'
    );
  }
}
