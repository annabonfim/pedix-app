// services/mockData.js
// Dados mockados para substituir a API C# quando ela não estiver disponível.
// Usado em authService.js

export const MOCK_CLIENTES = [
  {
    id: 'mock-cli-1',
    nome: 'Maria Silva',
    email: 'maria@email.com',
    senha: '123456',
    telefone: '11999990001',
  },
  {
    id: 'mock-cli-2',
    nome: 'Carlos Souza',
    email: 'carlos@email.com',
    senha: '123456',
    telefone: '11999990002',
  },
  {
    id: 'mock-cli-3',
    nome: 'Ana Costa',
    email: 'ana@email.com',
    senha: '123456',
    telefone: '11999990003',
  },
];

export const MOCK_GARCONS = [
  {
    id: 'mock-gar-1',
    nome: 'João Pedro da Silva',
    email: 'joao@pedix.com',
    senha: '123456',
    telefone: '11988880001',
    ativo: true,
  },
  {
    id: 'mock-gar-2',
    nome: 'Lucas Pereira',
    email: 'lucas@pedix.com',
    senha: '123456',
    telefone: '11988880002',
    ativo: true,
  },
  {
    id: 'mock-gar-3',
    nome: 'Fernanda Lima',
    email: 'fernanda@pedix.com',
    senha: '123456',
    telefone: '11988880003',
    ativo: true,
  },
];

// Simula delay de rede
export function mockDelay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
