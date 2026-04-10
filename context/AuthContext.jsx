// context/AuthContext.jsx
// Gerencia autenticação com 2 perfis: CLIENTE e ADMIN (garçom)

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginAsCliente,
  loginAsAdmin,
  registerCliente,
  logout as apiLogout,
  getCurrentUser,
  ROLES,
} from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, saveUser, getSavedUser } from '../utils/storage';
import { APP_CONFIG } from '../config/constants';
import { logger } from '../utils/logger';

// ─── TIPOS DE USUÁRIO ────────────────────────────────────────────────────────
export { ROLES };

// ─── CONTEXTO DE AUTENTICAÇÃO ────────────────────────────────────────────────
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
      // Usa usuário salvo localmente como alternativa offline
      const cachedUser = await getSavedUser();
      if (cachedUser) setUser(cachedUser);
    } finally {
      setLoading(false);
    }
  };

  // role: 'CLIENTE' | 'ADMIN'
  // Ambos usam email + senha

  const login = useCallback(async (email, senha, role) => {
    let result;
    if (role === 'ADMIN') {
      result = await loginAsAdmin(email, senha);
    } else {
      result = await loginAsCliente(email, senha);
    }
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    // Limpa mesa selecionada para não mostrar pedidos de sessões anteriores
    await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER);
    await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID);
    setUser(null);
    setToken(null);
  }, []);

  const register = useCallback(async (nome, email, senha, telefone) => {
    const result = await registerCliente(nome, email, senha, telefone);
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