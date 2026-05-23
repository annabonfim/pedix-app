// Serviço base para comunicação com a API Java (Spring Boot deployada no Azure)
// URL definida em config/constants.js

import { logger } from '../utils/logger';
import { APP_CONFIG } from '../config/constants';

const JAVA_API_BASE_URL = APP_CONFIG.JAVA_API_URL;

// Realiza uma requisição HTTP genérica contra a API Java.
// endpoint: caminho da API (ex: '/item-cardapio')
// options: método, body, headers, etc
export async function javaRequest(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body || null;
  const headers = options.headers || {};
  // Timeout pra evitar loading eterno em rede ruim ou cold start travado.
  // 30s é generoso o suficiente pro Azure tier Free acordar e responder.
  const timeoutMs = options.timeoutMs || 30_000;

  const config = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Adiciona headers customizados
  const headerKeys = Object.keys(headers);
  for (let i = 0; i < headerKeys.length; i++) {
    config.headers[headerKeys[i]] = headers[headerKeys[i]];
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  config.signal = controller.signal;

  const fullUrl = `${JAVA_API_BASE_URL}${endpoint}`;
  logger.log(`☕ Java ${method} ${fullUrl}`, body ? { body: JSON.parse(config.body) } : '');

  try {
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;
      let serverMessage = null;

      try {
        const errorData = await response.json();
        serverMessage =
          errorData.message || errorData.mensagem || errorData.error || null;
      } catch (_) {
        // resposta sem body JSON — segue com a mensagem padrão
      }

      // Mensagens amigáveis por status. Pra 404 a gente cita o endpoint
      // pra ficar claro o que não foi achado (antes dizia "mesa/comanda"
      // pra qualquer 404, mesmo em /item-cardapio).
      if (response.status === 404) {
        errorMessage = serverMessage
          || `Recurso não encontrado em ${endpoint}.`;
      } else if (response.status === 400) {
        errorMessage = serverMessage
          || 'Dados inválidos. Verifique as informações fornecidas.';
      } else if (response.status === 500) {
        errorMessage = serverMessage
          || 'Erro no servidor. Tente novamente mais tarde.';
      } else if (serverMessage) {
        errorMessage = serverMessage;
      }

      const javaError = new Error(errorMessage);
      javaError.status = response.status;
      throw javaError;
    }

    const data = await response.json();
    logger.log(`✅ Java ${method} ${endpoint}:`, data);
    return data;
  } catch (error) {
    // Timeout (AbortError) — fetch foi cancelado pelo nosso setTimeout
    if (error.name === 'AbortError') {
      const timeoutError = new Error(
        `Servidor demorou demais pra responder (${timeoutMs / 1000}s). Tente de novo.`
      );
      timeoutError.status = 'TIMEOUT';
      logger.error(`Timeout em ${endpoint}`, timeoutError);
      throw timeoutError;
    }

    // Se for erro de CORS ou rede, dá mensagem mais clara
    if (error.message && error.message.includes('Failed to fetch')) {
      const corsError = new Error('Erro de conexão. Verifique se o backend Java está acessível.');
      corsError.status = 'NETWORK_ERROR';
      logger.error(`Erro de rede/CORS na requisição ${endpoint}:`, corsError);
      throw corsError;
    }

    logger.error(`Erro Java ${endpoint}:`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Atalhos pros métodos HTTP comuns
export const javaApi = {
  get: (endpoint) => javaRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => javaRequest(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => javaRequest(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => javaRequest(endpoint, { method: 'DELETE' }),
};
