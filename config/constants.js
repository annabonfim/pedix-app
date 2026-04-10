// Constantes da aplicação

const getApiBaseUrl = () => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return 'http://10.0.2.2:8080/api';
  }
  return 'https://pedix-api-production.com/api';
};

export const APP_CONFIG = {
  API_BASE_URL: getApiBaseUrl(),
  STORAGE_KEYS: {
    USER_NAME: 'user:name',
    TABLE_NUMBER: 'table:number',
    RESTAURANTE_ID: 'restaurante:id',
  },
};

// Restaurantes disponíveis (mockado por enquanto)
export const RESTAURANTES = [
  { id: 1, nome: 'Italiano' },
  { id: 2, nome: 'Japonês' },
  { id: 3, nome: 'Brasileiro' },
];

// ID do restaurante válido (por enquanto só Italiano funciona)
export const RESTAURANTE_VALIDO_ID = 1;

// Categorias do cardápio (value = enum da API Java, label = exibição no app)
export const CATEGORIES = [
  { value: 'PRATO', label: 'Pratos' },
  { value: 'BEBIDA', label: 'Bebidas' },
  { value: 'SOBREMESA', label: 'Sobremesas' },
];


