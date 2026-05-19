// Serviço base para comunicação com a API Java
// URL definida em config/constants.js (default aponta pro deploy do Azure)

import { logger } from '../utils/logger';
import { APP_CONFIG } from '../config/constants';

const API_BASE_URL = APP_CONFIG.JAVA_API_URL;

// Realiza uma requisição HTTP genérica
// endpoint: caminho da API (ex: '/item-cardapio')
// options: método, body, headers, etc
export async function apiRequest(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body || null;
  const headers = options.headers || {};

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

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  logger.log(`🌐 ${method} ${fullUrl}`, body ? { body: JSON.parse(config.body) } : '');

  try {
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;
      
      try {
        const errorData = await response.json();
        
        // Tenta pegar mensagem de erro da API
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.mensagem) {
          errorMessage = errorData.mensagem;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        // Mensagens mais amigáveis para erros comuns
        if (response.status === 404) {
          errorMessage = 'Recurso não encontrado. Verifique se a mesa/comanda existe.';
        } else if (response.status === 400) {
          errorMessage = errorData.message || 'Dados inválidos. Verifique as informações fornecidas.';
        } else if (response.status === 500) {
          errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
        }
      } catch (parseError) {
        // Se não conseguir fazer parse do JSON, usa mensagem padrão
        if (response.status === 404) {
          errorMessage = 'Recurso não encontrado. Verifique se a mesa/comanda existe.';
        }
      }
      
      const apiError = new Error(errorMessage);
      apiError.status = response.status;
      throw apiError;
    }

    const data = await response.json();
    logger.log(`✅ Resposta ${method} ${endpoint}:`, data);
    return data;
  } catch (error) {
    // Se for erro de CORS ou rede, dá mensagem mais clara
    if (error.message && error.message.includes('Failed to fetch')) {
      const corsError = new Error('Erro de conexão. Verifique se o backend está rodando e se CORS está configurado.');
      corsError.status = 'NETWORK_ERROR';
      logger.error(`Erro de rede/CORS na requisição ${endpoint}:`, corsError);
      throw corsError;
    }
    
    logger.error(`Erro na requisição ${endpoint}:`, error);
    throw error;
  }
}

// Funções auxiliares para métodos HTTP comuns
export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};
