[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iyP6V_vz)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=21187983&assignment_repo_type=AssignmentRepo)

# Pedix 🍽️

Aplicativo mobile para gerenciamento de pedidos em restaurantes, desenvolvido com React Native e Expo.

## 📱 Sobre o Projeto

O Pedix é um aplicativo que permite aos clientes de restaurantes fazerem pedidos através de QR Code, visualizarem o cardápio, gerenciarem seus pedidos e acompanharem o status em tempo real.

---

## 🚀 Evolução do Projeto

### 📦 Sprint 1 - Funcionalidades Base

Na primeira sprint, o projeto foi estruturado com as funcionalidades essenciais:

#### Telas Implementadas:
- ✅ **Tela Inicial** (`index.jsx`) - Boas-vindas e entrada do nome do usuário
- ✅ **Tela de Scan** (`scan.jsx`) - Escaneamento de QR Code da mesa
- ✅ **Tela de Cardápio** (`menu.jsx`) - Visualização de itens do menu
- ✅ **Tela de Detalhes do Item** (`item.jsx`) - Visualização detalhada de cada item
- ✅ **Tela de Carrinho** (`cart.jsx`) - Gerenciamento do carrinho de compras

#### Componentes Base:
- ✅ `Button.jsx` - Botão reutilizável
- ✅ `Card.jsx` - Card reutilizável para exibição de conteúdo

#### Funcionalidades:
- ✅ Dados mockados/local (sem integração com API)
- ✅ Gerenciamento de estado com Context API (`CartContext.jsx`)
- ✅ Navegação entre telas com Expo Router
- ✅ Armazenamento local com AsyncStorage

---

### 🎯 Sprint 2 - Integração com API e Novas Funcionalidades

A segunda sprint trouxe a **integração completa com a API Java do backend**, substituindo todos os dados mockados por uma integração real. Além disso, foram implementadas melhorias significativas na arquitetura, novas funcionalidades e uma experiência de usuário aprimorada:

#### 🆕 Novas Telas:
- ✅ **Tela de Pedidos** (`orders.jsx`) - Visualização completa do histórico de pedidos
  - Lista todos os pedidos da comanda
  - Exibe status em tempo real com badges coloridos
  - Implementa pull-to-refresh
  - Cache inteligente de dados de itens
  
- ✅ **Tela de Edição de Pedidos** (`edit-order.jsx`) - Edição de pedidos existentes
  - Permite alterar quantidades de itens
  - Adicionar novos itens ao pedido
  - Remover itens do pedido
  - Editar observações
  - Validação de tempo (5 minutos após criação)

#### 🆕 Novos Componentes:
- ✅ `Dropdown.jsx` - Componente de seleção dropdown reutilizável
- ✅ `ItemImage.jsx` - Componente inteligente para exibição de imagens/emojis

#### 🏗️ Arquitetura e Organização:
- ✅ **Integração com API Java** 🆕
  - Substituição de dados mockados por integração real com backend
  - Comunicação REST com API Java do backend
  
- ✅ **Serviços de API** (`services/`)
  - `api.js` - Configuração centralizada da API
  - `menuService.js` - Operações relacionadas ao cardápio
  - `pedidoService.js` - Operações relacionadas a pedidos

- ✅ **Utilitários** (`utils/`)
  - `storage.js` - Funções auxiliares para AsyncStorage
  - `time.js` - Funções de tempo, validação e formatação de datas
  - `validation.js` - Validações reutilizáveis
  - `logger.js` - Logger condicional (só ativo em desenvolvimento)

- ✅ **Configurações** (`config/`)
  - `constants.js` - Constantes da aplicação centralizadas
  - `emojiMap.js` - Mapeamento de emojis

#### 🔧 Melhorias Técnicas:
- ✅ **Integração com API Java** - Substituição completa de dados mockados por API real
- ✅ Configuração de **ESLint** e **Prettier** para padronização de código
- ✅ **Logger condicional** - Sistema de logging que só funciona em desenvolvimento
- ✅ Refatoração das telas existentes para usar novos componentes
- ✅ Melhorias no gerenciamento de estado (`CartContext.jsx`)
- ✅ Integração de validações de restaurante
- ✅ Tratamento de erros aprimorado
- ✅ Melhorias de performance com cache de dados

#### ✨ Novas Funcionalidades:
- ✅ **Edição de Pedidos**: Permite editar pedidos nos primeiros 5 minutos
- ✅ **Cancelamento de Pedidos**: Permite cancelar pedidos nos primeiros 5 minutos
- ✅ **Acompanhamento de Status**: Visualização em tempo real do status dos pedidos
  - Pendente
  - Preparando
  - Pronto
  - Entregue
  - Cancelado
- ✅ **Contador de Tempo**: Mostra tempo restante para editar/cancelar pedido
- ✅ **Observações nos Pedidos**: Suporte para adicionar observações especiais
- ✅ **Pull-to-Refresh**: Atualização manual da lista de pedidos
- ✅ **Seleção de Restaurante**: Dropdown para seleção de restaurante na tela de scan

#### 🎨 Melhorias de UX/UI:
- ✅ Componente `ItemImage` que suporta tanto URLs de imagens quanto emojis
- ✅ Badges coloridos para status dos pedidos
- ✅ Feedback visual melhorado
- ✅ Validações com mensagens claras
- ✅ Loading states aprimorados
- ✅ Tratamento de estados vazios (sem pedidos, sem itens)

---

## 📊 Resumo das Mudanças

| Aspecto | Sprint 1 | Sprint 2 |
|--------|----------|----------|
| **Dados** | Mockados/Local | Integrado com API Java 🆕 |
| **Telas** | 5 telas | 7 telas (+2) |
| **Componentes** | 2 componentes | 4 componentes (+2) |
| **Serviços** | Nenhum | Camada de serviços organizada 🆕 |
| **Utilitários** | Nenhum | 3 módulos de utilitários 🆕 |
| **Configurações** | Nenhuma | 2 arquivos de configuração 🆕 |
| **Funcionalidades** | CRUD básico (mock) | + Edição, Cancelamento, Status (real) |
| **Qualidade de Código** | Básica | ESLint + Prettier configurados |
| **Arquitetura** | Monolítica | Modular e organizada |

---

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma para desenvolvimento React Native
- **Expo Router** - Roteamento baseado em arquivos
- **AsyncStorage** - Armazenamento local de dados
- **React Context** - Gerenciamento de estado global

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Um dispositivo físico ou emulador para testar o aplicativo

## 🚀 Como Executar

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd pedix
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm start
```

4. Escaneie o QR Code com o aplicativo Expo Go (iOS ou Android) ou pressione:
   - `i` para abrir no simulador iOS
   - `a` para abrir no emulador Android
   - `w` para abrir no navegador web

## 📁 Estrutura do Projeto

```
pedix/
├── app/                    # Telas da aplicação (Expo Router)
│   ├── _layout.jsx        # Layout principal
│   ├── index.jsx          # Tela inicial (Sprint 1)
│   ├── scan.jsx           # Tela de escaneamento QR (Sprint 1)
│   ├── menu.jsx           # Tela do cardápio (Sprint 1)
│   ├── item.jsx           # Detalhes do item (Sprint 1)
│   ├── cart.jsx           # Carrinho de compras (Sprint 1)
│   ├── orders.jsx         # Lista de pedidos (Sprint 2) 🆕
│   └── edit-order.jsx     # Edição de pedidos (Sprint 2) 🆕
├── components/            # Componentes reutilizáveis
│   ├── Button.jsx        # Sprint 1
│   ├── Card.jsx          # Sprint 1
│   ├── Dropdown.jsx      # Sprint 2 🆕
│   └── ItemImage.jsx     # Sprint 2 🆕
├── context/               # Contextos React
│   └── CartContext.jsx   # Melhorado na Sprint 2
├── services/              # Serviços de API (Sprint 2) 🆕
│   ├── api.js
│   ├── menuService.js
│   └── pedidoService.js
├── utils/                 # Utilitários (Sprint 2) 🆕
│   ├── storage.js
│   ├── time.js
│   └── validation.js
└── config/                # Configurações (Sprint 2) 🆕
    ├── constants.js
    └── emojiMap.js
```

## 📝 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run android` - Inicia no Android
- `npm run ios` - Inicia no iOS
- `npm run web` - Inicia no navegador web

## 🔧 Configuração

O aplicativo utiliza variáveis de ambiente e configurações em `config/constants.js`. Certifique-se de configurar as URLs da API corretamente antes de executar.

## 📱 Funcionalidades Detalhadas

### Escaneamento de QR Code
- Escaneie o QR Code da mesa para vincular sua sessão
- O número da mesa é salvo automaticamente
- **Sprint 2**: Adicionado dropdown para seleção de restaurante

### Cardápio
- Navegação por categorias
- Visualização de itens com imagens/emojis
- Busca e filtros
- Detalhes completos de cada item
- **Sprint 2**: Melhorias visuais com componente ItemImage

### Carrinho
- Adição e remoção de itens
- Ajuste de quantidades
- Cálculo automático do total
- Adição de observações
- **Sprint 2**: Melhorias de UX e validações

### Pedidos (Sprint 2) 🆕
- Visualização de todos os pedidos
- Status em tempo real com badges coloridos
- Edição de pedidos (primeiros 5 minutos)
- Cancelamento de pedidos (primeiros 5 minutos)
- Histórico completo
- Pull-to-refresh para atualização
- Cache inteligente de dados

### Edição de Pedidos (Sprint 2) 🆕
- Alteração de quantidades
- Adição de novos itens
- Remoção de itens
- Edição de observações
- Validação de tempo de edição
- Cálculo dinâmico do total

## 🎯 Próximos Passos (Futuras Sprints)

- [ ] Notificações push para mudanças de status
- [ ] Sistema de avaliação de pedidos
- [ ] Histórico completo de pedidos anteriores
- [ ] Integração com pagamento
- [ ] Modo offline
- [ ] Testes automatizados

## 📄 Licença

Este projeto é privado e desenvolvido para fins educacionais.

## 👥 Autores

Desenvolvido como parte do Sprint 2 - CodeGirls

---

Made with ❤️ using React Native and Expo
