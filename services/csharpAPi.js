// Cliente HTTP para a API .NET (ASP.NET Core).
// Responsável por: auth (JWT), clientes, garçons, mesas, pedidos e pagamentos.
// A API Java cuida do cardápio, categorias, avaliações, histórico e relatórios.

import { getToken } from '../utils/storage';
import { logger } from '../utils/logger';

const CSHARP_API_URL =
  'https://pedix-api-dotnet-bge2dyd6gudpapem.brazilsouth-01.azurewebsites.net/api';

const getCSharpBaseUrl = () => CSHARP_API_URL;

export const CSHARP_API_BASE_URL = getCSharpBaseUrl();

// ─── REQUEST BASE ─────────────────────────────────────────────────────────────
export async function csharpRequest(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body || null;
  const requiresAuth = options.requiresAuth !== false; // autenticado por padrão

  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const fullUrl = `${CSHARP_API_BASE_URL}${endpoint}`;
  logger.log(`🔷 C# ${method} ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.mensagem ||
          errorData.title ||
          errorMessage;
      } catch (_) {}

      if (response.status === 401) errorMessage = 'Sessão expirada. Faça login novamente.';
      if (response.status === 403) errorMessage = 'Acesso negado.';

      const err = new Error(errorMessage);
      err.status = response.status;
      throw err;
    }

    // 204 No Content
    if (response.status === 204) return null;

    const data = await response.json();
    logger.log(`✅ C# ${method} ${endpoint}:`, data);
    return data;
  } catch (error) {
    if (error.message?.includes('Failed to fetch')) {
      const connError = new Error('Sem conexão com a API principal. Verifique se o servidor está rodando.');
      connError.status = 'NETWORK_ERROR';
      throw connError;
    }
    logger.error(`Erro C# ${endpoint}:`, error);
    throw error;
  }
}

export const csharpApi = {
  get: (endpoint, opts = {}) => csharpRequest(endpoint, { ...opts, method: 'GET' }),
  post: (endpoint, body, opts = {}) =>
    csharpRequest(endpoint, { ...opts, method: 'POST', body }),
  put: (endpoint, body, opts = {}) =>
    csharpRequest(endpoint, { ...opts, method: 'PUT', body }),
  delete: (endpoint, opts = {}) => csharpRequest(endpoint, { ...opts, method: 'DELETE' }),
};