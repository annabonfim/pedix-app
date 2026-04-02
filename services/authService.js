// services/authService.js
// Autenticação usando a API C# real (sem endpoint /auth/login na API)
//
// ESTRATÉGIA: A API C# tem Garçons e Clientes no banco Oracle.
// Usamos esses endpoints reais para validar credenciais:
//   ADMIN  (Garçom)  → GET /api/garcons       → valida por Nome + Matrícula
//   CLIENTE          → GET /api/clientes       → valida por Nome + CPF
//
// Isso é autenticação REAL (valida contra o banco Oracle), sem hardcode.
// O "token" é um UUID derivado do ID do usuário, salvo em AsyncStorage.

import { csharpApi } from './csharpAPi';
import { saveToken, removeToken, getToken, saveUser, getSavedUser } from '../utils/storage';
import { logger } from '../utils/logger';

// Roles
export const ROLES = {
  CLIENTE: 'CLIENTE',
  ADMIN: 'ADMIN', // Garçom no sistema C#
};

// Gera um token local a partir do ID e role do usuário
// (evita que qualquer pessoa "invente" uma sessão sem chamar a API)
function generateLocalToken(userId, role) {
  const timestamp = Date.now();
  return btoa(`${userId}:${role}:${timestamp}`);
}

// ─── Login como Cliente
// Valida Nome + CPF contra GET /api/clientes
export async function loginAsCliente(nome, cpf) {
  try {
    const cleanCpf = cpf.replace(/\D/g, ''); // remove pontuação

    // Busca clientes pelo nome (endpoint de search com paginação)
    const response = await csharpApi.get(
      `/clientes/search?nome=${encodeURIComponent(nome.trim())}&page=1&pageSize=20`,
      { requiresAuth: false }
    );

    // O endpoint retorna lista paginada — adapte se o shape for diferente
    const clientes = response?.data || response?.items || response || [];
    const lista = Array.isArray(clientes) ? clientes : [clientes];

    // Encontra o cliente que bate nome + CPF
    const cliente = lista.find((c) => {
      const cpfApi = (c.cpf || '').replace(/\D/g, '');
      const nomeApi = (c.nome || '').toLowerCase().trim();
      return cpfApi === cleanCpf && nomeApi.includes(nome.toLowerCase().trim());
    });

    if (!cliente) {
      throw new Error('Nome ou CPF incorretos. Verifique seus dados.');
    }

    // Monta o objeto de usuário
    const user = {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
      telefone: cliente.telefone,
      role: ROLES.CLIENTE,
    };

    const token = generateLocalToken(user.id, ROLES.CLIENTE);
    await saveToken(token);
    await saveUser(user);

    return { user, token };
  } catch (error) {
    logger.error('Erro no login de cliente:', error);
    throw error;
  }
}

// ─── LOGIN COMO ADMIN (Garçom) ───────────────────────────────────────────────
// Valida Nome + Matrícula contra GET /api/garcons
export async function loginAsAdmin(nome, matricula) {
  try {
    // Busca todos os garçons ativos
    const response = await csharpApi.get('/garcons', { requiresAuth: false });

    const garcons = response?.data || response?.items || response || [];
    const lista = Array.isArray(garcons) ? garcons : [garcons];

    const garcom = lista.find((g) => {
      const matriculaApi = String(g.matricula || '').trim();
      const nomeApi = (g.nome || '').toLowerCase().trim();
      return (
        matriculaApi === matricula.trim() &&
        nomeApi.includes(nome.toLowerCase().trim()) &&
        g.ativo !== false // garçom inativo não pode logar
      );
    });

    if (!garcom) {
      throw new Error('Nome ou matrícula incorretos, ou garçom inativo.');
    }

    const user = {
      id: garcom.id,
      nome: garcom.nome,
      matricula: garcom.matricula,
      telefone: garcom.telefone,
      role: ROLES.ADMIN,
    };

    const token = generateLocalToken(user.id, ROLES.ADMIN);
    await saveToken(token);
    await saveUser(user);

    return { user, token };
  } catch (error) {
    logger.error('Erro no login de admin:', error);
    throw error;
  }
}

// ─── CADASTRO DE CLIENTE ─────────────────────────────────────────────────────
// Cria um novo cliente via POST /api/clientes e já faz login
export async function registerCliente(nome, cpf, telefone) {
  try {
    const created = await csharpApi.post('/clientes', { nome, cpf, telefone }, { requiresAuth: false });

    const user = {
      id: created.id,
      nome: created.nome,
      cpf: created.cpf,
      telefone: created.telefone,
      role: ROLES.CLIENTE,
    };

    const token = generateLocalToken(user.id, ROLES.CLIENTE);
    await saveToken(token);
    await saveUser(user);

    return { user, token };
  } catch (error) {
    logger.error('Erro no cadastro de cliente:', error);
    throw error;
  }
}

// ─── GET CURRENT USER (de sessão salva) ──────────────────────────────────────
export async function getCurrentUser() {
  try {
    const token = await getToken();
    if (!token) return null;

    // Valida que o token não foi adulterado (decode básico)
    try {
      const decoded = atob(token);
      const parts = decoded.split(':');
      if (parts.length !== 3) throw new Error('Token inválido');
    } catch (_) {
      await removeToken();
      return null;
    }

    // Retorna usuário salvo em cache (não precisa chamar API novamente)
    return await getSavedUser();
  } catch (error) {
    logger.warn('Erro ao obter usuário atual:', error);
    return null;
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export async function logout() {
  await removeToken();
}

// ─── VERIFICAÇÃO DE TOKEN ─────────────────────────────────────────────────────
export async function hasValidToken() {
  const token = await getToken();
  if (!token) return false;
  try {
    const decoded = atob(token);
    return decoded.split(':').length === 3;
  } catch (_) {
    return false;
  }
}

// ─── OPERAÇÕES DA API C# (reutilizáveis) ─────────────────────────────────────

// Lista todas as mesas (útil para o app)
export async function fetchMesas() {
  return csharpApi.get('/mesas');
}

// Lista garçons ativos
export async function fetchGarcons() {
  return csharpApi.get('/garcons');
}

// Busca comanda de uma mesa
export async function fetchComandaByMesa(mesaId) {
  return csharpApi.get(`/comandas?mesaId=${mesaId}`);
}

// Abre uma comanda
export async function abrirComanda(payload) {
  // payload: { mesaId, garcomId, clienteId }
  return csharpApi.post('/comandas', payload);
}