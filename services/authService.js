// services/authService.js
// Auth real integrado com a API .NET (Atendimentos.Api).
// Mantém a mesma interface do antigo serviço mockado pra não quebrar
// AuthContext/login.jsx/signup.jsx.
//
// MAPPING DE ROLES:
//   App.ROLES.CLIENTE → API "Cliente"
//   App.ROLES.ADMIN   → API "Garcom"   (rótulo "Garçom" no app)
//   App.ROLES.GERENTE → API "Admin"    (admin do sistema, precisa AdminKey)
//
// Login: único endpoint /api/auth/login. O role vem dentro do JWT como claim.
// Conferimos a role do token contra a role escolhida na tela e bloqueamos
// se não bater (ex: cliente tentando logar na aba garçom).

import { csharpApi } from './csharpAPi';
import { userFromJwt, isJwtExpired } from '../utils/jwt';
import {
  saveToken, removeToken, getToken, saveUser, getSavedUser,
} from '../utils/storage';
import { logger } from '../utils/logger';

// ─── ROLES (app) ──────────────────────────────────────────────────────────────
export const ROLES = {
  CLIENTE: 'CLIENTE',
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
};

// App e API usam vocabulários diferentes pra mesma coisa:
//   App.ADMIN  (label "Garçom" na UI)  ↔  API.Garcom
//   App.GERENTE                        ↔  API.Admin (precisa AdminKey)
// Mantemos os dois sentidos da tradução pra não mexer no código de nenhum lado.
const API_ROLE = {
  [ROLES.CLIENTE]: 'Cliente',
  [ROLES.ADMIN]: 'Garcom',
  [ROLES.GERENTE]: 'Admin',
};

const APP_ROLE = {
  Cliente: ROLES.CLIENTE,
  Garcom: ROLES.ADMIN,
  Admin: ROLES.GERENTE,
};

// Constrói o objeto user que o app espera a partir do JWT.
// Telefone não vem no token; o login não retorna telefone — fica null
// (o app só usa nome/email/role nas telas).
function buildUserFromToken(token) {
  const claims = userFromJwt(token);
  const appRole = APP_ROLE[claims.role];
  if (!appRole) {
    throw new Error(`Role desconhecida recebida do servidor: ${claims.role}`);
  }
  return {
    id: claims.id,
    nome: claims.nome,
    email: claims.email,
    telefone: null,
    role: appRole,
  };
}

// A API tem um único endpoint /auth/login que autentica qualquer role.
// A tela de login força a escolha do perfil (Cliente/Garçom/Gerente) antes,
// então a gente confere o claim de role do JWT contra a escolha — senão um
// cliente conseguiria entrar na interface de garçom só com email/senha dele.
async function loginWithExpectedRole(email, senha, expectedAppRole) {
  const resp = await csharpApi.post(
    '/auth/login',
    { email: email.toLowerCase().trim(), senha },
    { requiresAuth: false },
  );

  const token = resp?.token;
  if (!token) {
    throw new Error('Resposta inválida do servidor (token ausente).');
  }

  const user = buildUserFromToken(token);

  if (user.role !== expectedAppRole) {
    const labels = { CLIENTE: 'Cliente', ADMIN: 'Garçom', GERENTE: 'Gerente' };
    throw new Error(
      `Esta conta é de ${labels[user.role] || user.role}, não de ${labels[expectedAppRole]}. ` +
      `Selecione o perfil correto.`
    );
  }

  await saveToken(token);
  await saveUser(user);
  return { user, token };
}

// ─── LOGIN COMO CLIENTE ──────────────────────────────────────────────────────
export async function loginAsCliente(email, senha) {
  try {
    return await loginWithExpectedRole(email, senha, ROLES.CLIENTE);
  } catch (error) {
    logger.error('Erro no login de cliente:', error);
    throw error;
  }
}

// ─── LOGIN COMO ADMIN (Garçom) ───────────────────────────────────────────────
export async function loginAsAdmin(email, senha) {
  try {
    return await loginWithExpectedRole(email, senha, ROLES.ADMIN);
  } catch (error) {
    logger.error('Erro no login de admin/garçom:', error);
    throw error;
  }
}

// ─── LOGIN COMO GERENTE ──────────────────────────────────────────────────────
export async function loginAsGerente(email, senha) {
  try {
    return await loginWithExpectedRole(email, senha, ROLES.GERENTE);
  } catch (error) {
    logger.error('Erro no login de gerente:', error);
    throw error;
  }
}

// ─── CADASTRO DE CLIENTE ─────────────────────────────────────────────────────
// /auth/register-cliente só cria a conta — não devolve JWT. Fazemos login
// logo em seguida pra a pessoa já entrar autenticada sem digitar de novo.
export async function registerCliente(nome, email, senha, telefone, dataNascimento) {
  try {
    if (!dataNascimento) {
      throw new Error('Data de nascimento é obrigatória.');
    }

    await csharpApi.post(
      '/auth/register-cliente',
      {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha,
        telefone: telefone.trim(),
        dataNascimento, // ISO string (ex: "2003-01-15T00:00:00")
      },
      { requiresAuth: false },
    );

    // cadastro OK → faz login automático pra obter JWT
    return await loginWithExpectedRole(email, senha, ROLES.CLIENTE);
  } catch (error) {
    logger.error('Erro no cadastro de cliente:', error);
    throw error;
  }
}

// ─── GET CURRENT USER (a partir do token salvo) ──────────────────────────────
// Usado no restoreSession. Se o token estiver expirado, limpa e retorna null.
export async function getCurrentUser() {
  try {
    const token = await getToken();
    if (!token) return null;

    if (isJwtExpired(token)) {
      await removeToken();
      return null;
    }

    try {
      return buildUserFromToken(token);
    } catch (e) {
      logger.warn('Token JWT inválido, removendo:', e);
      await removeToken();
      return null;
    }
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
  return !!token && !isJwtExpired(token);
}

// ─── OPERAÇÕES MOCKADAS REMOVIDAS ────────────────────────────────────────────
// fetchGarcons agora vem do garçomService real (se necessário).
// Mantida exportação vazia pra não quebrar imports legados, mas o app
// não deve mais usar.
export async function fetchGarcons() {
  logger.warn('fetchGarcons() deprecated — usar service específico');
  return [];
}
