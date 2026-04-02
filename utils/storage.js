// utils/storage.js — substitui o arquivo existente
// Adiciona funções de token JWT ao storage já existente

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

const TOKEN_KEY = 'auth:token';
const USER_KEY = 'auth:user';

// ─── TOKEN ────────────────────────────────────────────────────────────────────
export async function saveToken(token) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    logger.error('Erro ao salvar token:', e);
    throw e;
  }
}

export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    logger.error('Erro ao ler token:', e);
    return null;
  }
}

export async function removeToken() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (e) {
    logger.error('Erro ao remover token:', e);
  }
}

// ─── USER ─────────────────────────────────────────────────────────────────────
export async function saveUser(user) {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    logger.error('Erro ao salvar usuário:', e);
  }
}

export async function getSavedUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// ─── GENERIC ─────────────────────────────────────────────────────────────────
export async function clearAllData() {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    logger.error('Erro ao limpar dados:', e);
  }
}

export async function getData(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    logger.error(`Erro ao ler chave ${key}:`, e);
    return null;
  }
}

export async function setData(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    logger.error(`Erro ao salvar chave ${key}:`, e);
  }
}