// context/AuthContext.jsx
// Gerencia autenticação JWT com 2 perfis: CLIENTE e ADMIN

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginAsCliente,
  loginAsAdmin,
  registerCliente,
  logout as apiLogout,
  getCurrentUser,
  ROLES,
} from '../services/authService';
import { getToken, saveUser, getSavedUser } from '../utils/storage';
import { logger } from '../utils/logger';

// ─── ROLES ───────────────────────────────────────────────────────────────────
export { ROLES };

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true enquanto verifica sessão salva

  // Verifica sessão ao iniciar o app
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const savedToken = await getToken();
      if (!savedToken) {
        setLoading(false);
        return;
      }

      // Token existe → tenta buscar usuário na API
      setToken(savedToken);
      const currentUser = await getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        await saveUser(currentUser);
      } else {
        // Token inválido/expirado → usa usuário em cache
        const cachedUser = await getSavedUser();
        if (cachedUser) setUser(cachedUser);
      }
    } catch (error) {
      logger.warn('Erro ao restaurar sessão:', error);
      // Tenta usuário em cache como fallback offline
      const cachedUser = await getSavedUser();
      if (cachedUser) setUser(cachedUser);
    } finally {
      setLoading(false);
    }
  };

  // role: 'CLIENTE' | 'ADMIN'
  // CLIENTE  → valida nome + CPF via GET /api/clientes
  // ADMIN    → valida nome + matrícula via GET /api/garcons
  
  const login = useCallback(async (nome, credential, role) => {
    let result;
    if (role === 'ADMIN') {
      result = await loginAsAdmin(nome, credential);
    } else {
      result = await loginAsCliente(nome, credential);
    }
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
  }, []);

  const register = useCallback(async (nome, cpf, telefone) => {
    const result = await registerCliente(nome, cpf, telefone);
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  // helpers
  const isAdmin = user?.role === ROLES.ADMIN || user?.perfil === ROLES.ADMIN;
  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}