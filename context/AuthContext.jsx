// context/AuthContext.jsx
// Gerencia autenticação com 2 perfis: CLIENTE e ADMIN (garçom)

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginAsCliente,
  loginAsAdmin,
  loginAsGerente,
  registerCliente,
  logout as apiLogout,
  getCurrentUser,
  ROLES,
} from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, saveUser, getSavedUser } from '../utils/storage';
import { APP_CONFIG, RESTAURANTE_VALIDO_ID } from '../config/constants';
import { logger } from '../utils/logger';
import { fetchPedidosByCliente } from '../services/pedidoService';
import { csharpApi } from '../services/csharpAPi';

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

  // role: 'CLIENTE' | 'ADMIN' | 'GERENTE'

  // Limpa contexto da sessão (mesa + restaurante). Disparado em logins/registers
  // explícitos e no logout — NÃO disparado no restoreSession (que só ressuscita
  // sessão pré-existente). Resultado:
  //   - reload com token válido    → restoreSession → mesa permanece ✅
  //   - login explícito ou cadastro → mesa limpa; mas se cliente tem pedido em
  //     aberto, tryRestoreMesaFromOpenPedidos repõe a mesa logo em seguida ✅
  //   - logout                     → mesa limpa pra próximo usuário não herdar ✅
  const clearSessionContext = async () => {
    await AsyncStorage.multiRemove([
      APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER,
      APP_CONFIG.STORAGE_KEYS.MESA_ID,
      APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID,
    ]);
  };

  // Quando cliente faz login e já tem pedido em aberto (não FINALIZADO nem
  // CANCELADO), restaura a mesa automaticamente em vez de mandar pro /scan.
  // Caso clássico: cliente fecha o app no meio do pedido e volta depois —
  // ninguém quer escanear o QR de novo só pra ver a conta.
  const tryRestoreMesaFromOpenPedidos = async (clienteId) => {
    try {
      const pedidos = await fetchPedidosByCliente(clienteId);
      const TERMINAIS = new Set(['FINALIZADO', 'CANCELADO']);
      const aberto = pedidos
        .filter((p) => !TERMINAIS.has((p.status || '').toUpperCase()))
        .filter((p) => (p.itens || []).length > 0)  // ignora zumbis sem itens
        .sort((a, b) => new Date(b.dataPedido || 0) - new Date(a.dataPedido || 0))[0];
      if (!aberto?.mesaId) return;

      const mesas = await csharpApi.get('/mesas');
      const mesa = (Array.isArray(mesas) ? mesas : []).find((m) => m.id === aberto.mesaId);
      if (!mesa) return;

      await AsyncStorage.multiSet([
        [APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER, String(mesa.numero)],
        [APP_CONFIG.STORAGE_KEYS.MESA_ID, mesa.id],
        [APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID, String(RESTAURANTE_VALIDO_ID)],
      ]);
      logger.log('[AUTH] Mesa restaurada de pedido em aberto:', mesa.numero);
    } catch (e) {
      // Silencioso — se falhar, cliente cai no fluxo normal de /scan
      logger.warn('[AUTH] Falha ao tentar restaurar mesa:', e?.message || e);
    }
  };

  const login = useCallback(async (email, senha, role) => {
    await clearSessionContext();
    let result;
    if (role === 'GERENTE') {
      result = await loginAsGerente(email, senha);
    } else if (role === 'ADMIN') {
      result = await loginAsAdmin(email, senha);
    } else {
      result = await loginAsCliente(email, senha);
    }
    setUser(result.user);
    setToken(result.token);
    // Cliente: tenta restaurar mesa de pedido em aberto (não bloqueia
    // login se falhar; aguarda pra não causar flash de "selecionar mesa")
    if (role === 'CLIENTE') {
      await tryRestoreMesaFromOpenPedidos(result.user.id);
    }
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    await clearSessionContext();
    setUser(null);
    setToken(null);
  }, []);

  const register = useCallback(async (nome, email, senha, telefone, dataNascimento) => {
    await clearSessionContext();
    const result = await registerCliente(nome, email, senha, telefone, dataNascimento);
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  // helpers
  const isGerente = user?.role === ROLES.GERENTE;
  const isAdmin = isGerente || user?.role === ROLES.ADMIN || user?.perfil === ROLES.ADMIN;
  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isGerente,
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