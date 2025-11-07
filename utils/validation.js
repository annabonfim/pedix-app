// Funções de validação

import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, RESTAURANTE_VALIDO_ID } from '../config/constants';
import { logger } from './logger';

// Verifica se o usuário selecionou um restaurante
export async function hasSelectedRestaurante() {
  try {
    const restauranteId = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID);
    if (!restauranteId) return false;
    
    // Por enquanto, só valida se for o restaurante válido
    const id = parseInt(restauranteId, 10);
    return id === RESTAURANTE_VALIDO_ID;
  } catch (error) {
    logger.warn('Erro ao verificar restaurante:', error);
    return false;
  }
}

// Verifica se um restaurante é válido
export function isRestauranteValido(restauranteId) {
  return parseInt(restauranteId, 10) === RESTAURANTE_VALIDO_ID;
}


