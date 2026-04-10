# Pedix 🍽️

Aplicativo mobile para gerenciamento de pedidos em restaurantes, desenvolvido com React Native e Expo. O Pedix permite que clientes selecionem sua mesa (via QR Code ou entrada manual), naveguem pelo cardápio, façam pedidos e acompanhem o status em tempo real. Garçons gerenciam mesas e pedidos por um painel administrativo. Gerentes possuem acesso completo ao CRUD do cardápio.

---

## 🚀 Evolução do Projeto

### Sprint 1 — Funcionalidades Base
Estrutura inicial com 5 telas (início, scan, cardápio, item, carrinho), dados mockados localmente, navegação com Expo Router e armazenamento com AsyncStorage.

### Sprint 2 — Integração com API Java
Integração real com API Java para cardápio e pedidos. Novas telas de listagem e edição de pedidos, edição/cancelamento com janela de 5 minutos, acompanhamento de status em tempo real, pull-to-refresh e camada de serviços organizada.

### Sprint 3 — Autenticação, Admin, QR Code e Temas _(sprint atual)_

Detalhada abaixo.

---

## ✨ Sprint 3 — O que foi implementado

### 🔐 Autenticação com três perfis

- **Tela de Login** (`login.jsx`) — toggle entre Cliente, Garçom e Gerente
  - Todos os perfis: login por e-mail + senha
- **Tela de Cadastro** (`signup.jsx`) — registro de novos clientes (nome, e-mail, senha, telefone)
- **AuthContext** + **AuthGuard** para proteção de rotas
- Token local gerado via `btoa(id:role:timestamp)`, persistido em AsyncStorage
- Sessão persistente (reabrir o app mantém o usuário logado)

### 🧭 Navegação condicional por perfil

O app exibe **tabs e fluxos diferentes** dependendo do tipo de usuário:

**Cliente:**
- Login → Selecionar mesa (scan QR ou manual, sem tabs) → Cardápio
- Tabs: Mesa, Cardápio, Carrinho, Pedidos
- A tela de scan não mostra tabs (similar ao login)

**Garçom:**
- Login → Home (com resumo de mesas)
- Tabs: Home, Cardápio, Mesas
- Sem acesso a Carrinho, Pedidos ou Scan (gerencia tudo pelo Dashboard de Mesas)

**Gerente:**
- Tudo que o Garçom acessa + CRUD completo do Cardápio
- Tabs: Home, Cardápio (com botões de editar/deletar/adicionar), Mesas
- Botão "+" no header do cardápio para criar novos itens
- Botões de editar e deletar em cada item do cardápio

### 🎨 Sistema de temas (light / dark mode)

- `ThemeContext` global com persistência via AsyncStorage
- Botão de alternância (sol/lua) em **todas as telas principais**
- Paleta de cores centralizada em `styles/theme.js`

### 👨‍🍳 Telas exclusivas do Garçom (Admin)

- **Home do Garçom** — resumo rápido de mesas (livres, ocupadas, total) com atalhos para Dashboard e Cardápio
- **Dashboard de Mesas** (`app/admin/mesas.jsx`) — grid visual com status colorido (livre/ocupada), ordenado por número
- **Pedidos por Mesa** (`app/admin/mesa-pedidos.jsx`) — pipeline visual de status e ação de avançar pedido com um toque (Em Preparo → Pronto → Entregue)

### 📷 Leitura real de QR Code

- Câmera integrada via `expo-camera` com `barcodeScannerSettings`
- Suporte a dois formatos: `QR001` (formato do banco Oracle) e JSON
- Overlay visual com frame de enquadramento e permissão de câmera
- Entrada manual mantida como fallback

### 🔄 Atualização automática de dados

- Hooks TanStack Query (`useMenuItems`, `usePedidos`, `useMesas`)
- `invalidateQueries` em todas as mutações → refresh automático após criar, editar, cancelar ou avançar status
- Polling a cada 30 segundos para refletir mudanças do backend

### 📦 Endpoint de Mesas na API Java

- Criado endpoint `GET /api/mesas` na API Java para listar mesas do banco Oracle
- Dashboard de mesas do garçom agora usa dados reais do banco de dados
- Entidade `Mesa`, Repository, Service e Controller seguindo o padrão do projeto

### ✅ CRUD completo de duas entidades

| Entidade | Create | Read | Update | Delete | Perfil |
|----------|:---:|:---:|:---:|:---:|:---:|
| **Pedidos** | ✅ carrinho | ✅ orders | ✅ edit-order | ✅ cancelar | Cliente |
| **Itens do Cardápio** | ✅ item-form | ✅ menu | ✅ item-form | ✅ menu | Gerente |
| **Status de pedido** | — | ✅ mesa-pedidos | ✅ avançar status | — | Garçom |
| **Clientes** | ✅ signup | — | — | — | Cliente |

---

## ⚠️ APIs e Dados Mockados

O app se comunica com a **API Java** (Spring Boot, porta 8080) para todas as funcionalidades principais:

| Funcionalidade | Fonte | Status |
|----------------|-------|--------|
| Cardápio (itens do menu) | API Java | ✅ Real |
| Pedidos (CRUD completo) | API Java | ✅ Real |
| Mesas (dashboard do garçom) | API Java | ✅ Real |
| Login / Cadastro | Mock local | ⚠️ Mockado |

### Por que o login está mockado?

A autenticação utiliza a **API C#** (.NET), que já foi desenvolvida pela equipe. Porém, como ela depende de **.NET 8 SDK + Oracle** para rodar, o professor de Mobile não conseguirá executá-la no ambiente de avaliação. Por isso, os dados de login foram **mockados** em `services/mockData.js` para garantir que o app funcione sem essa dependência.

> A API C# existe e está funcional — o mock é apenas para facilitar a avaliação. Para integrar, basta restaurar os imports em `services/authService.js`.

---

## 🔑 Credenciais de Teste

### Cliente
| E-mail | Senha |
|--------|-------|
| maria@email.com | 123456 |
| carlos@email.com | 123456 |
| ana@email.com | 123456 |

### Garçom
| E-mail | Senha |
|--------|-------|
| joao@pedix.com | 123456 |
| lucas@pedix.com | 123456 |
| fernanda@pedix.com | 123456 |

### Gerente
| E-mail | Senha |
|--------|-------|
| paula@pedix.com | 123456 |
| roberto@pedix.com | 123456 |

> Também é possível cadastrar um novo cliente pela tela de signup (nome, e-mail, senha e telefone). O cadastro é válido apenas durante a sessão.

### QR Code de Teste — Mesa 1

Escaneie o QR Code abaixo com o app para selecionar a mesa 1 automaticamente:

<img src="assets/qr-code-mesa1.png" alt="QR Code Mesa 1" width="200" />

> ⚠️ A leitura de QR Code **só funciona no dispositivo físico** (via Expo Go no celular). No emulador, utilize a entrada manual de mesa.

Também é possível gerar outros QR Codes com o texto `QR002`, `QR003`, etc. para simular outras mesas.

---

## 🛠️ Tecnologias

- **React Native** + **Expo** (SDK 54)
- **Expo Router** — roteamento baseado em arquivos
- **TanStack Query** — gerenciamento de estado do servidor e cache
- **AsyncStorage** — persistência local
- **expo-camera** — leitura de QR Code
- **React Context** — estado global (auth, tema, carrinho)

---

## 🚀 Como Executar o App Mobile

```bash
# 1. Clone o repositório
git clone https://github.com/annabonfim/pedix-mobile-sprint3.git
cd pedix-mobile-sprint3

# 2. Instale as dependências
npm install

# 3. Inicie o servidor Expo
npm start
```

- Escaneie o QR Code com **Expo Go** (iOS/Android), ou
- `a` para emulador Android / `i` para simulador iOS / `w` para navegador

> ⚠️ A **API Java deve estar rodando** (porta 8080) para que cardápio, pedidos, mesas e status funcionem.

**Dicas de teste:**
- Use o restaurante **"Italiano"** (ID 1) — único integrado ao backend
- Mesas de **1 a 11**
- Cliente: faça login → selecione mesa → navegue pelo cardápio → faça pedidos
- Garçom: faça login → veja o resumo de mesas → acesse o dashboard
- Gerente: faça login → acesse o cardápio → crie, edite ou remova itens

---

## 🔗 Repositórios das APIs

### 🟨 API Java (Cardápio, Pedidos e Mesas)

**Repositório:** [github.com/annabonfim/pedix-api](https://github.com/annabonfim/pedix-api)

```bash
git clone <url-da-api-java>
cd <pasta-da-api-java>
./mvnw spring-boot:run
```
Roda em `http://localhost:8080`.

### 🟦 API C# (Clientes e Garçons — autenticação)

**Repositório:** [TODO: adicionar link]

> ⚠️ A API C# já foi desenvolvida pela equipe, mas **requer .NET 8 SDK + Oracle** para rodar. Como o professor de Mobile não terá esse ambiente configurado, o login no app está **mockado** para facilitar a avaliação. A integração real está preparada em `services/csharpAPi.js`.

```bash
# Para quem tiver o ambiente .NET + Oracle configurado:
git clone <url-da-api-csharp>
cd <pasta-da-api-csharp>
dotnet restore
dotnet run --project src/Atendimentos.API
```
Roda em `http://localhost:5070`. Requer .NET 8 SDK + Oracle.

---

## 📹 Vídeo Demonstrativo

- **Sprint 3:** https://youtu.be/bcCg763gASI
- **Sprint 2:** https://youtu.be/bAi_9F6_JrE

---

## 📁 Estrutura do Projeto

```
pedix/
├── app/                          # Telas (Expo Router)
│   ├── _layout.jsx              # Layout + AuthGuard + tabs condicionais por perfil
│   ├── index.jsx                # Home (garçom) / redirect pro scan (cliente)
│   ├── login.jsx                # Login (Sprint 3)
│   ├── signup.jsx               # Cadastro (Sprint 3)
│   ├── scan.jsx                 # QR Code com câmera (Sprint 3)
│   ├── menu.jsx                 # Cardápio
│   ├── item.jsx                 # Detalhes do item
│   ├── cart.jsx                 # Carrinho
│   ├── orders.jsx               # Pedidos
│   ├── edit-order.jsx           # Edição de pedido
│   ├── admin/                   # Garçom (Sprint 3)
│   │   ├── mesas.jsx            # Dashboard de mesas
│   │   └── mesa-pedidos.jsx     # Pedidos por mesa
│   └── gerente/                 # Gerente (Sprint 3)
│       └── item-form.jsx       # Criar/editar item do cardápio
├── components/                   # Componentes reutilizáveis
│   ├── Button.jsx
│   ├── Card.jsx
│   └── ItemImage.jsx
├── context/                      # Estado global
│   ├── CartContext.jsx
│   ├── AuthContext.jsx          # Sprint 3
│   └── ThemeContext.jsx         # Sprint 3
├── hooks/                        # TanStack Query hooks
│   ├── useMenuItems.js
│   ├── usePedidos.js
│   └── useMesas.js
├── services/                     # Camada de API
│   ├── api.js                   # Cliente HTTP (detecção automática de plataforma)
│   ├── menuService.js
│   ├── pedidoService.js
│   ├── authService.js           # Autenticação mockada (Sprint 3)
│   └── mockData.js              # Dados mockados de login (Sprint 3)
├── styles/
│   └── theme.js                 # Paleta e estilos compartilhados
├── utils/
│   ├── storage.js
│   ├── time.js
│   ├── validation.js
│   └── logger.js
└── config/
    └── constants.js
```

---

## 📊 Resumo das Sprints

| Aspecto | Sprint 1 | Sprint 2 | Sprint 3 |
|---------|----------|----------|----------|
| **Dados** | Mockados local | API Java real | API Java (cardápio, pedidos, mesas) + login mockado |
| **Telas** | 5 | 7 | 12 |
| **Autenticação** | — | — | Login + cadastro (3 perfis) 🆕 |
| **Admin** | — | — | Dashboard de mesas + gestão de status 🆕 |
| **QR Code** | UI apenas | UI apenas | Câmera real 🆕 |
| **Tema** | Claro | Claro | Light + Dark 🆕 |
| **Navegação** | Fixa | Fixa | Condicional por perfil 🆕 |
| **CRUD** | Básico | Pedidos completo | + Cardápio (gerente) + Status + Cadastro 🆕 |
| **Auto-refresh** | — | Pull manual | invalidateQueries + polling 🆕 |

---

## 👥 Autores

Desenvolvido como parte da Sprint 3 — **CodeGirls**

---

Made with ❤️ using React Native and Expo
