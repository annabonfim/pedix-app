// Constantes da aplicação

// API Java (deployada no Azure) — cardápio, categorias, avaliações, relatórios.
// URL da .NET fica em services/csharpAPi.js (hardcoded; não é compartilhada
// porque só aquele service consome).
const JAVA_API_URL = 'https://pedix-api-aab0evapangybdh7.eastus-01.azurewebsites.net/api';

export const APP_CONFIG = {
  JAVA_API_URL,
  STORAGE_KEYS: {
    USER_NAME: 'user:name',
    TABLE_NUMBER: 'table:number',
    MESA_ID: 'mesa:id', // Guid da mesa na API .NET (necessário pra criar pedidos)
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


