// Utilitários para AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../config/constants';

// Limpa todos os dados do AsyncStorage (útil para testes)
export async function clearAllData() {
  try {
    const keys = Object.values(APP_CONFIG.STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('✅ Todos os dados foram limpos');
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    return false;
  }
}

// Limpa apenas o restaurante selecionado
export async function clearRestaurante() {
  try {
    await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID);
    console.log('✅ Restaurante foi limpo');
    return true;
  } catch (error) {
    console.error('Erro ao limpar restaurante:', error);
    return false;
  }
}

// Mostra todos os dados salvos (útil para debug)
export async function showAllData() {
  try {
    const keys = Object.values(APP_CONFIG.STORAGE_KEYS);
    const data = {};
    
    for (let i = 0; i < keys.length; i++) {
      const value = await AsyncStorage.getItem(keys[i]);
      data[keys[i]] = value;
    }
    
    console.log('📦 Dados salvos:', data);
    return data;
  } catch (error) {
    console.error('Erro ao ler dados:', error);
    return {};
  }
}


