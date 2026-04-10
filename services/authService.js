// services/authService.js
// Autenticação MOCKADA (API C# não disponível durante Sprint 3).
//
// ESTRATÉGIA: Usa dados mockados em services/mockData.js para validar
// credenciais. Mantém a mesma interface do serviço real — quando a API C#
// estiver disponível, basta trocar os imports de volta.
//
//   ADMIN  (Garçom)  → lista mockada MOCK_GARCONS  → Nome + Matrícula
//   CLIENTE          → lista mockada MOCK_CLIENTES → Nome + CPF
//
// O "token" é gerado localmente (btoa do id + role + timestamp) e salvo
// em AsyncStorage junto com o objeto do usuário.

import { saveToken, removeToken, getToken, saveUser, getSavedUser } from '../utils/storage';
import { logger } from '../utils/logger';
import { MOCK_CLIENTES, MOCK_GARCONS, MOCK_GERENTES, mockDelay } from './mockData';

// Roles
export const ROLES = {
  CLIENTE: 'CLIENTE',
  ADMIN: 'ADMIN', // Garçom no sistema C#
  GERENTE: 'GERENTE', // Gerente — acesso completo + CRUD do cardápio
};

// Gera um token local a partir do ID e role do usuário
function generateLocalToken(userId, role) {
  const timestamp = Date.now();
  return btoa(`${userId}:${role}:${timestamp}`);
}

// ─── LOGIN COMO CLIENTE ──────────────────────────────────────────────────────
// Valida email + senha contra a lista mockada
export async function loginAsCliente(email, senha) {
  try {
    await mockDelay();
    const emailLower = email.toLowerCase().trim();

    const cliente = MOCK_CLIENTES.find((c) => {
      return c.email.toLowerCase() === emailLower && c.senha === senha;
    });

    if (!cliente) {
      throw new Error('E-mail ou senha incorretos. Verifique seus dados.');
    }

    const user = {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
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
// Valida email + senha contra a lista mockada
export async function loginAsAdmin(email, senha) {
  try {
    await mockDelay();
    const emailLower = email.toLowerCase().trim();

    const garcom = MOCK_GARCONS.find((g) => {
      return (
        g.email.toLowerCase() === emailLower &&
        g.senha === senha &&
        g.ativo !== false
      );
    });

    if (!garcom) {
      throw new Error('E-mail ou senha incorretos, ou garçom inativo.');
    }

    const user = {
      id: garcom.id,
      nome: garcom.nome,
      email: garcom.email,
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

// ─── LOGIN COMO GERENTE ─────────────────────────────────────────────────────
// Valida email + senha contra a lista mockada de gerentes
export async function loginAsGerente(email, senha) {
  try {
    await mockDelay();
    const emailLower = email.toLowerCase().trim();

    const gerente = MOCK_GERENTES.find((g) => {
      return (
        g.email.toLowerCase() === emailLower &&
        g.senha === senha &&
        g.ativo !== false
      );
    });

    if (!gerente) {
      throw new Error('E-mail ou senha incorretos, ou gerente inativo.');
    }

    const user = {
      id: gerente.id,
      nome: gerente.nome,
      email: gerente.email,
      telefone: gerente.telefone,
      role: ROLES.GERENTE,
    };

    const token = generateLocalToken(user.id, ROLES.GERENTE);
    await saveToken(token);
    await saveUser(user);

    return { user, token };
  } catch (error) {
    logger.error('Erro no login de gerente:', error);
    throw error;
  }
}

// ─── CADASTRO DE CLIENTE ─────────────────────────────────────────────────────
// Cria um novo cliente em memória e já faz login
// (não persiste entre reloads do app — só durante a sessão)
export async function registerCliente(nome, email, senha, telefone) {
  try {
    await mockDelay();
    const emailLower = email.toLowerCase().trim();

    // Verifica se email já existe
    const existente = MOCK_CLIENTES.find(
      (c) => c.email.toLowerCase() === emailLower
    );
    if (existente) {
      throw new Error('Já existe um cliente cadastrado com esse e-mail.');
    }

    const novo = {
      id: `mock-cli-${Date.now()}`,
      nome: nome.trim(),
      email: emailLower,
      senha: senha,
      telefone: telefone.trim(),
    };

    MOCK_CLIENTES.push(novo);

    const user = {
      id: novo.id,
      nome: novo.nome,
      email: novo.email,
      telefone: novo.telefone,
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

    try {
      const decoded = atob(token);
      const parts = decoded.split(':');
      if (parts.length !== 3) throw new Error('Token inválido');
    } catch (_) {
      await removeToken();
      return null;
    }

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

// ─── OPERAÇÕES MOCKADAS ──────────────────────────────────────────────────────

export async function fetchGarcons() {
  await mockDelay();
  return MOCK_GARCONS;
}
