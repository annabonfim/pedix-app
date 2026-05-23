# Pedix 🍽️

Aplicativo mobile completo para gerenciamento de pedidos em restaurantes, desenvolvido com **React Native + Expo**. O sistema cobre o fluxo de ponta a ponta: o cliente escaneia o QR Code da mesa, navega pelo cardápio, conversa com a assistente de IA **Tutti**, faz pedidos, paga a conta e acompanha tudo em tempo real; o garçom enxerga as comandas abertas e avança os status; o gerente administra cardápio (CRUD), categorias, relatórios e avaliações.

---

## 🚀 Evolução do Projeto

| Sprint | Foco | Status |
|--------|------|--------|
| **Sprint 1** | Estrutura base (5 telas, dados mockados, Expo Router, AsyncStorage) | ✅ Concluída |
| **Sprint 2** | Integração com API Java (cardápio + pedidos), edição/cancelamento, status em tempo real | ✅ Concluída |
| **Sprint 3** | Autenticação 3 perfis, painel do garçom, QR Code real, temas claro/escuro, perfil Gerente | ✅ Concluída |
| **Sprint 4** | Assistente de IA Tutti, integração .NET (pedidos/mesas/pagamentos), notificações, dashboard de comandas, autenticação real com JWT | ✅ Concluída |

---

## ✨ Sprint 4 — O que foi implementado

### 🤖 Tutti — Assistente de IA

Tutti é a mascote-assistente do cliente: tira dúvidas sobre o cardápio, sugere pratos e ajuda com o pedido em linguagem natural.

- Chat conversacional flutuante (FAB) em todas as telas do cliente
- **Notificação proativa** quando o cliente passa muito tempo no cardápio sem decidir
- Animação `TuttiLoading` reaproveitada nas telas com carregamento longo (cliente)
- Não aparece pra garçom/gerente (guard por papel)

### 💳 Pagamento ponta-a-ponta

Fluxo completo de fechamento de conta:

1. Cliente clica "Pagar conta" em `orders.jsx`
2. Escolhe método (PIX / Crédito / Débito / Dinheiro)
3. App cria pagamento na API .NET (`POST /api/pagamentos`)
4. Maquininha simulada (delay ~2.5s)
5. Pagamento aprovado automaticamente (`PUT /pagamentos/{id}/aprovar`)
6. **Em cascata**: todos os pedidos ativos do cliente naquela mesa viram `ENTREGUE`
7. Mesa volta pra `LIVRE` (se não tem outros clientes ativos)
8. Notificação local "✅ Pagamento aprovado"

### 🪑 Mesa auto-status

A API .NET agora mantém o status da mesa coerente automaticamente:

- **Criar pedido** → mesa vira `OCUPADA`
- **Último pedido entregue** → mesa volta pra `LIVRE`
- **Cancelamento** mantém a mesa ocupada (cliente pode estar trocando o pedido)

### 👤 Comanda por cliente (não por mesa)

Cada cliente tem **sua própria comanda**, mesmo dividindo mesa com outras pessoas. Vantagens:

- Privacidade (cada um vê só os próprios pedidos)
- Pagamento individual (sem discussão sobre dividir conta)
- Mesa indica só onde entregar

O garçom vê a visão consolidada pela mesa no dashboard.

### 🔔 Notificações locais

Notificações disparadas em vários eventos:

- Status de pedido (`EM_PREPARO → PRONTO → ENTREGUE`)
- Pagamento aprovado
- Tutti proativo (cliente parado no cardápio)

Implementadas com `expo-notifications`, canal Android dedicado, foreground + background.

### 🛎️ Dashboard de comandas (Garçom)

Tela de mesas redesenhada — cada card mostra a comanda ativa por dentro:

- Itens agregados com quantidade (`• 2x Pizza Margherita`)
- Total da mesa
- Quantidade de pedidos
- Avanço de status direto da tela `mesa-pedidos` (`ABERTO → EM_PREPARO → PRONTO → ENTREGUE`)

### 📊 Telas administrativas (Gerente)

| Tela | Endpoint | Permissão |
|------|----------|-----------|
| **Categorias** (CRUD) | `/api/categorias-cardapio` | Gerente |
| **Relatórios** (lista) | `/api/relatorios` | Gerente |
| **Avaliações** (lista + delete) | `/api/avaliacoes` | Gerente |

### ⭐ Avaliações pelo cliente

Cliente pode avaliar pedidos e itens individuais (1–5 estrelas + comentário) via `POST /api/avaliacoes`. Listagem visível pra todos os perfis.

### 🕐 Histórico de pedidos

Linha do tempo visual mostrando todas as mudanças de status de cada pedido, agrupadas por número. Endpoint `/api/historicos-pedidos`.

### 📱 Tela "Sobre o App"

Mostra **versão** e **hash do commit** atual (injetado em build via `app.config.js` lendo `git rev-parse --short HEAD`). Atende o requisito da Sprint 4 de identificação da versão publicada.

### 🔐 Autenticação real com JWT

Login deixou de ser mock — agora bate na API .NET. Senhas hash com **BCrypt**, JWT válido por sessão, role embedded no token (`Cliente`/`Garcom`/`Admin`). Cadastro de admin/garçom protegido por `AdminKey` (config server-side).

---

## 🏗️ Arquitetura

O sistema é dividido em **2 backends** com responsabilidades distintas:

```
┌──────────────────────────────┐
│   Mobile App (React Native)  │
└──────────────────────────────┘
       │             │
       ▼             ▼
┌──────────────┐  ┌──────────────────┐
│   API Java   │  │    API .NET      │
│   (Spring)   │  │  (ASP.NET Core)  │
│              │  │                  │
│ • Cardápio   │  │ • Autenticação   │
│ • Categorias │  │   (JWT + BCrypt) │
│ • Avaliações │  │ • Clientes       │
│ • Histórico  │  │ • Garçons        │
│ • Relatórios │  │ • Mesas          │
└──────────────┘  │ • Pedidos        │
   Azure ✅       │ • Itens-Pedido   │
                  │ • Pagamentos     │
                  └──────────────────┘
                  Azure ✅
```

**Camada de UI** consome as duas APIs de forma transparente — `services/javaApi.js` e `services/csharpAPi.js` são clientes HTTP separados que isolam cada base URL. Hooks do TanStack Query orquestram as chamadas e mantêm o cache sincronizado.

---

## 👥 Perfis de Usuário

| Perfil | Acesso |
|--------|--------|
| 🔵 **Cliente** | Mesa (QR Code), cardápio, carrinho, pedidos, **pagamento**, avaliações, histórico, **chat com a Tutti** |
| 🟠 **Garçom** | Dashboard de comandas, cardápio, avançar status de pedidos, avaliações, histórico |
| 🟣 **Gerente** | Tudo do garçom + CRUD do cardápio, categorias, relatórios |

---

## 📱 Telas (16 no total)

```
Públicas/Auth
├── login.jsx              Login (3 perfis) — JWT real
├── signup.jsx             Cadastro de cliente
└── sobre.jsx              Versão + hash do commit

Cliente
├── index.jsx              Home (atalhos)
├── scan.jsx               QR Code da mesa
├── menu.jsx               Cardápio (com Tutti FAB)
├── item.jsx               Detalhe do item
├── cart.jsx               Carrinho
├── orders.jsx             Meus pedidos + botão "Pagar conta"
├── edit-order.jsx         Editar/cancelar pedido (5min window)
├── pagamento.jsx          Pagamento + escolha de método 🆕
├── avaliacoes.jsx         Lista de avaliações
├── avaliacao-form.jsx     Nova avaliação
└── historico.jsx          Histórico de status

Garçom
├── admin/mesas.jsx        Dashboard de comandas (preview de itens)
└── admin/mesa-pedidos.jsx Pedidos por mesa (avançar status)

Gerente
├── gerente/item-form.jsx  CRUD de item do cardápio
├── gerente/categorias.jsx CRUD de categorias
└── gerente/relatorios.jsx Lista de relatórios
```

---

## 🔑 Credenciais de Teste

Login agora é real — bate na API .NET com BCrypt + JWT. Os usuários abaixo estão cadastrados no banco Oracle.

### Cliente
| E-mail | Senha |
|--------|-------|
| cliente@pedix.com | cliente123 |

> Você também pode criar um novo cliente pela tela de **signup** do app.

### Garçom
| E-mail | Senha |
|--------|-------|
| garcom@pedix.com | garcom123 |

### Gerente
| E-mail | Senha |
|--------|-------|
| admin@pedix.com | admin123 |

> Cadastro de garçom/gerente exige `AdminKey` configurada no servidor — feito via `POST /api/auth/register-garcom` ou `/register-admin` (não tem UI no app).

### QR Code de Teste — Mesa 1

<img src="assets/qr-code-mesa1.png" alt="QR Code Mesa 1" width="200" />

> A leitura de QR Code só funciona em **dispositivo físico** (Expo Go no celular). No emulador, use a entrada manual de mesa.

---

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Framework | **React Native + Expo** (SDK 54) |
| Roteamento | **Expo Router** (file-based) |
| Estado servidor | **TanStack Query** (queries, mutations, refetch) |
| Persistência local | **AsyncStorage** |
| Câmera | **expo-camera** (QR Code) |
| Notificações | **expo-notifications** (locais) |
| Estado global | **React Context** (auth, tema, carrinho) |

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Expo Go instalado no celular (iOS/Android)
- Ou: emulador Android / simulador iOS

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/annabonfim/pedix-app.git
cd pedix-app

# 2. Instale as dependências
npm install

# 3. Inicie o servidor Expo
npm start
```

- Escaneie o QR Code com **Expo Go** (iOS/Android), ou
- `a` para emulador Android · `i` para simulador iOS · `w` para navegador

> ⚠️ **As duas APIs estão deployadas no Azure** — você não precisa rodar nada localmente pra testar o app de ponta a ponta. Qualquer push em `main` redeploya automaticamente via GitHub Actions.

### URLs das APIs

```js
// services/javaApi.js
JAVA_API_URL  = 'https://pedix-api-aab0evapangybdh7.eastus-01.azurewebsites.net/api'

// services/csharpAPi.js
CSHARP_API_URL = 'https://pedix-dotnet-api-anna.azurewebsites.net/api'
```

### Dicas

- Use o restaurante **"Italiano"** (ID 1) — único integrado
- Mesas de 1 a 11
- **Cliente:** login → selecionar mesa → cardápio → pedido → pagar
- **Garçom:** login → dashboard de mesas → escolher mesa → avançar status
- **Gerente:** login → cardápio (CRUD) ou categorias/relatórios pelo Home

---

## 🔗 Repositórios Relacionados

| API | Repositório | Status |
|-----|-------------|--------|
| 🟨 **Java** (cardápio, categorias, avaliações, histórico, relatórios) | [github.com/alanerochaa/pedix-api](https://github.com/alanerochaa/pedix-api) | ✅ Deployada no Azure |
| 🟦 **.NET** (auth, clientes, garçons, mesas, pedidos, pagamentos) | [github.com/annabonfim/pedix-dotnet-api](https://github.com/annabonfim/pedix-dotnet-api) | ✅ Deployada no Azure (CI/CD via GitHub Actions) |

---

## 📹 Vídeos Demonstrativos

- **Sprint 4:** _em produção_
- **Sprint 3:** https://youtu.be/bcCg763gASI
- **Sprint 2:** https://youtu.be/bAi_9F6_JrE

---

## ✅ CRUD completo de duas entidades (requisito Sprint 3)

| Entidade | Create | Read | Update | Delete | Perfil |
|----------|:---:|:---:|:---:|:---:|:---:|
| **Pedidos** | ✅ carrinho | ✅ orders | ✅ edit-order | ✅ cancelar | Cliente |
| **Itens do Cardápio** | ✅ item-form | ✅ menu | ✅ item-form | ✅ menu | Gerente |
| **Categorias do Cardápio** | ✅ categorias | ✅ categorias | ✅ categorias | ✅ categorias | Gerente |
| **Avaliações** | ✅ avaliacao-form | ✅ avaliacoes | — | ✅ avaliacoes | Cliente/Gerente |
| **Status de pedido** | — | ✅ mesa-pedidos | ✅ avançar status | — | Garçom |
| **Pagamentos** | ✅ pagamento | ✅ via pedido | ✅ aprovar (auto) | — | Cliente |
| **Clientes** | ✅ signup | — | — | — | Cliente |

---

## 📁 Estrutura do Projeto

```
pedix/
├── app/                          Telas (Expo Router)
│   ├── _layout.jsx               Layout + AuthGuard + tabs por perfil + TuttiChatProvider
│   ├── index.jsx                 Home com atalhos (label varia por papel)
│   ├── login.jsx                 Login (3 perfis) com JWT
│   ├── signup.jsx                Cadastro de cliente
│   ├── scan.jsx                  QR Code com câmera + lookup de mesaId
│   ├── menu.jsx                  Cardápio (com botões CRUD pro Gerente, Tutti FAB pro cliente)
│   ├── item.jsx                  Detalhe do item
│   ├── cart.jsx                  Carrinho
│   ├── orders.jsx                Pedidos do cliente + botão "Pagar conta"
│   ├── edit-order.jsx            Edição de pedido (5min window)
│   ├── pagamento.jsx             Pagamento + método (PIX/CRED/DEB/$) 🆕
│   ├── avaliacoes.jsx            Lista de avaliações
│   ├── avaliacao-form.jsx        Nova avaliação
│   ├── historico.jsx             Histórico de status
│   ├── sobre.jsx                 Sobre o App (hash do commit)
│   ├── admin/
│   │   ├── mesas.jsx             Dashboard de comandas (preview por mesa)
│   │   └── mesa-pedidos.jsx      Pedidos por mesa (avançar status)
│   └── gerente/
│       ├── item-form.jsx         CRUD de item
│       ├── categorias.jsx        CRUD de categorias
│       └── relatorios.jsx        Lista de relatórios
│
├── components/                   Componentes reutilizáveis
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── ItemImage.jsx
│   └── Tutti/                    Assistente de IA 🆕
│       ├── TuttiFAB.jsx          Botão flutuante do chat
│       ├── TuttiChatModal.jsx    Modal de conversa
│       └── TuttiLoading.jsx      Loading com mascote
│
├── context/                      Estado global
│   ├── AuthContext.jsx           3 perfis (Cliente/Garçom/Gerente)
│   ├── CartContext.jsx
│   ├── ThemeContext.jsx          Light/dark
│   └── TuttiChatContext.jsx      Abre/fecha o chat de qualquer tela 🆕
│
├── hooks/                        TanStack Query hooks
│   ├── useMenuItems.js           Cardápio (CRUD)
│   ├── useCategorias.js          Categorias (CRUD)
│   ├── usePedidos.js             useMeusPedidos, usePedidosByMesa, useAllPedidos
│   ├── useMesas.js               Mesas (status enum)
│   ├── useAvaliacoes.js          Avaliações (CRUD)
│   ├── useRelatorios.js          Relatórios
│   ├── useHistoricos.js          Histórico
│   ├── usePagamento.js           Fluxo de pagamento + aprovação 🆕
│   ├── usePedidoStatusNotifications.js   Detecta mudança de status
│   └── useTuttiProactiveNotification.js  Notif "decidiu o pedido?" 🆕
│
├── services/                     Camada de API
│   ├── javaApi.js                Cliente HTTP da API Java (Azure) 🆕
│   ├── csharpAPi.js              Cliente HTTP da API .NET (local)
│   ├── menuService.js            Cardápio (Java)
│   ├── categoriaService.js       Categorias (Java)
│   ├── pedidoService.js          Pedidos + itens (.NET)
│   ├── pagamentoService.js       Pagamentos (.NET) 🆕
│   ├── avaliacaoService.js       Avaliações (Java)
│   ├── relatorioService.js       Relatórios (Java)
│   ├── historicoService.js       Histórico (Java)
│   └── authService.js            Login real via JWT (.NET) 🆕
│
├── utils/
│   ├── notifications.js          Helper expo-notifications
│   ├── jwt.js                    Parser de JWT (extrai role) 🆕
│   ├── storage.js
│   ├── time.js                   parseAsUtc, formatPedidoDate, translateStatus
│   ├── validation.js
│   └── logger.js
│
├── styles/
│   └── theme.js                  Paleta + estilos compartilhados
│
├── config/
│   └── constants.js              URLs das APIs (Java Azure + .NET)
│
├── app.config.js                 Injeta hash do commit no build 🆕
└── README.md
```

---

## 🎯 Resumo das Sprints

| Aspecto | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|---------|----------|----------|----------|----------|
| **Telas** | 5 | 7 | 12 | **16** 🆕 (+ pagamento) |
| **Dados** | Mockados | API Java local | API Java local | **Java + .NET no Azure** 🆕 |
| **Autenticação** | — | — | 3 perfis (mock) | **JWT real + BCrypt** 🆕 |
| **CRUD completo** | — | Pedidos | + Cardápio | + Categorias + Avaliações + **Pagamentos** 🆕 |
| **Auto-refresh** | — | Pull manual | invalidateQueries + polling | + 5s real-time |
| **Notificações** | — | — | — | **Status pedido + pagamento + Tutti proativo** 🆕 |
| **Assistente IA** | — | — | — | **Tutti (chat + proativo)** 🆕 |
| **Tema** | Claro | Claro | Light + Dark | mantido |
| **Versionamento** | — | — | — | **Hash do commit visível** |

---

## 👩‍💻 Autores

Desenvolvido pela equipe **CodeGirls** — FIAP · 2TDSPS · Challenge Oracle 2026

- Anna Bonfim — Mobile (React Native)
- Alane Rocha — API Java (Spring Boot)
- Duda Araujo — API .NET (ASP.NET Core)

---

Made with ❤️ using React Native, Expo, Spring Boot and ASP.NET Core
