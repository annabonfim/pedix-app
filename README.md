# Pedix 🍽️

Aplicativo mobile completo para gerenciamento de pedidos em restaurantes, desenvolvido com **React Native + Expo**. O sistema cobre o fluxo de ponta a ponta: o cliente escaneia o QR Code da mesa, navega pelo cardápio, faz pedidos e acompanha em tempo real; o garçom gerencia mesas e atualiza status; o gerente administra o cardápio (CRUD completo), categorias, relatórios e avaliações.

---

## 🚀 Evolução do Projeto

| Sprint | Foco | Status |
|--------|------|--------|
| **Sprint 1** | Estrutura base (5 telas, dados mockados, Expo Router, AsyncStorage) | ✅ Concluída |
| **Sprint 2** | Integração com API Java (cardápio + pedidos), edição/cancelamento, status em tempo real | ✅ Concluída |
| **Sprint 3** | Autenticação 3 perfis, painel do garçom, QR Code real, temas claro/escuro, perfil Gerente | ✅ Concluída |
| **Sprint 4** | Notificações push, telas administrativas, integração com API Java deployada (Azure), tela "Sobre o App" | 🟢 Em curso |

---

## ✨ Sprint 4 — O que foi implementado

### 🔔 Notificações locais

Notificações disparadas automaticamente quando o status de um pedido muda (`EM_PREPARO → PRONTO → ENTREGUE`). Implementadas com `expo-notifications`:

- Permissão pedida no startup do app
- Canal Android dedicado (`pedidos`) com importância alta
- Hook `usePedidoStatusNotifications` detecta mudanças nos pedidos e dispara mensagens contextuais
- Funciona em foreground e background

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

### ☁️ API Java deployada no Azure

Mobile aponta direto pra `https://pedix-api-aab0evapangybdh7.eastus-01.azurewebsites.net/api`. Não precisa rodar API local pra testar cardápio, categorias, avaliações, histórico e relatórios.

---

## 🏗️ Arquitetura

O sistema é dividido em **3 backends** com responsabilidades distintas:

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
│ • Cardápio   │  │ • Clientes       │
│ • Categorias │  │ • Garçons        │
│ • Avaliações │  │ • Mesas          │
│ • Histórico  │  │ • Comandas       │
│ • Relatórios │  │ • Pedidos*       │
└──────────────┘  │ • Pagamentos*    │
   Azure ✅       └──────────────────┘
                  Em deploy 🟡
                 (* a integrar)
```

**Hoje:** Mobile usa API Java (Azure) pro cardápio e features administrativas; pedidos e mesas estão na Java enquanto a .NET não deploya. Após deploy da .NET, será migrado pra arquitetura final.

---

## 👥 Perfis de Usuário

| Perfil | Acesso |
|--------|--------|
| 🔵 **Cliente** | Mesa (QR Code), cardápio, carrinho, pedidos, avaliações, histórico |
| 🟠 **Garçom** | Dashboard de mesas, cardápio, status de pedidos, avaliações, histórico |
| 🟣 **Gerente** | Tudo do garçom + CRUD do cardápio, categorias, relatórios |

---

## 📱 Telas (15 no total)

```
Públicas/Auth
├── login.jsx              Login (3 perfis)
├── signup.jsx             Cadastro de cliente
└── sobre.jsx              Versão + hash do commit

Cliente
├── index.jsx              Home (atalhos)
├── scan.jsx               QR Code da mesa
├── menu.jsx               Cardápio
├── item.jsx               Detalhe do item
├── cart.jsx               Carrinho
├── orders.jsx             Meus pedidos
├── edit-order.jsx         Editar/cancelar pedido
├── avaliacoes.jsx         Lista de avaliações
├── avaliacao-form.jsx     Nova avaliação
└── historico.jsx          Histórico de status

Garçom
├── admin/mesas.jsx        Dashboard de mesas
└── admin/mesa-pedidos.jsx Pedidos por mesa

Gerente
├── gerente/item-form.jsx  CRUD de item do cardápio
├── gerente/categorias.jsx CRUD de categorias
└── gerente/relatorios.jsx Lista de relatórios
```

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

> Cliente pode se cadastrar pela tela de signup. Login mockado em `services/mockData.js` (a API C# que faz autenticação requer .NET 8 + Oracle, ambiente que o professor de Mobile não tem — por isso o mock garante que o app funcione na avaliação).

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

> ⚠️ **A API Java já está deployada no Azure** — você não precisa rodar nenhuma API localmente para testar cardápio, categorias, avaliações, histórico ou relatórios.

### URLs das APIs

```js
// config/constants.js
JAVA_API_URL  = 'https://pedix-api-aab0evapangybdh7.eastus-01.azurewebsites.net/api'  // ✅ Azure
DOTNET_API_URL = 'http://10.0.2.2:5070/api'  // ⏳ deploy pendente
```

### Dicas

- Use o restaurante **"Italiano"** (ID 1) — único integrado
- Mesas de 1 a 11
- **Cliente:** login → selecionar mesa → cardápio → pedido
- **Garçom:** login → resumo de mesas → dashboard
- **Gerente:** login → cardápio (botão de adicionar/editar/deletar) ou categorias/relatórios pelo Home

---

## 🔗 Repositórios Relacionados

| API | Repositório | Status |
|-----|-------------|--------|
| 🟨 **Java** (cardápio, categorias, avaliações, histórico, relatórios) | [github.com/alanerochaa/pedix-api](https://github.com/alanerochaa/pedix-api) | ✅ Deployada no Azure |
| 🟦 **.NET** (clientes, garçons, mesas, comandas, pedidos) | [github.com/DudaAraujo14/C-](https://github.com/DudaAraujo14/C-) | 🟡 Deploy em curso |

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
| **Clientes** | ✅ signup | — | — | — | Cliente |

---

## 📁 Estrutura do Projeto

```
pedix/
├── app/                          Telas (Expo Router)
│   ├── _layout.jsx               Layout + AuthGuard + tabs por perfil
│   ├── index.jsx                 Home com atalhos
│   ├── login.jsx                 Login (3 perfis)
│   ├── signup.jsx                Cadastro
│   ├── scan.jsx                  QR Code com câmera
│   ├── menu.jsx                  Cardápio (com botões CRUD pro Gerente)
│   ├── item.jsx                  Detalhe do item
│   ├── cart.jsx                  Carrinho
│   ├── orders.jsx                Pedidos do cliente
│   ├── edit-order.jsx            Edição de pedido
│   ├── avaliacoes.jsx            Lista de avaliações 🆕
│   ├── avaliacao-form.jsx        Nova avaliação 🆕
│   ├── historico.jsx             Histórico de status 🆕
│   ├── sobre.jsx                 Sobre o App (hash do commit) 🆕
│   ├── admin/
│   │   ├── mesas.jsx             Dashboard de mesas
│   │   └── mesa-pedidos.jsx      Pedidos por mesa
│   └── gerente/
│       ├── item-form.jsx         CRUD de item
│       ├── categorias.jsx        CRUD de categorias 🆕
│       └── relatorios.jsx        Lista de relatórios 🆕
│
├── components/                   Componentes reutilizáveis
│   ├── Button.jsx
│   ├── Card.jsx
│   └── ItemImage.jsx
│
├── context/                      Estado global
│   ├── AuthContext.jsx           3 perfis (Cliente/Garçom/Gerente)
│   ├── CartContext.jsx
│   └── ThemeContext.jsx          Light/dark
│
├── hooks/                        TanStack Query hooks
│   ├── useMenuItems.js           Cardápio (CRUD)
│   ├── useCategorias.js          Categorias (CRUD) 🆕
│   ├── usePedidos.js             Pedidos (CRUD)
│   ├── useMesas.js               Mesas
│   ├── useAvaliacoes.js          Avaliações (CRUD) 🆕
│   ├── useRelatorios.js          Relatórios 🆕
│   ├── useHistoricos.js          Histórico 🆕
│   └── usePedidoStatusNotifications.js   Detecta mudança de status 🆕
│
├── services/                     Camada de API
│   ├── api.js                    Cliente HTTP
│   ├── menuService.js
│   ├── categoriaService.js       🆕
│   ├── pedidoService.js
│   ├── mesaService.js
│   ├── avaliacaoService.js       🆕
│   ├── relatorioService.js       🆕
│   ├── historicoService.js       🆕
│   ├── authService.js            Login mockado
│   ├── mockData.js               Mock dos 3 perfis
│   └── csharpAPi.js              Cliente da API C# (preparado)
│
├── utils/
│   ├── notifications.js          Helper expo-notifications 🆕
│   ├── storage.js
│   ├── time.js
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
| **Telas** | 5 | 7 | 12 | **15** 🆕 |
| **Dados** | Mockados | API Java local | API Java local | **API Java Azure** 🆕 |
| **Autenticação** | — | — | 3 perfis | 3 perfis (mantido) |
| **CRUD completo** | — | Pedidos | + Cardápio | + Categorias + Avaliações 🆕 |
| **Auto-refresh** | — | Pull manual | invalidateQueries + polling | + 5s real-time 🆕 |
| **Notificações** | — | — | — | **Local (status pedido)** 🆕 |
| **Tema** | Claro | Claro | Light + Dark | mantido |
| **Versionamento** | — | — | — | **Hash do commit visível** 🆕 |

---

## 👩‍💻 Autores

Desenvolvido pela equipe **CodeGirls** — FIAP · 2TDSPS · Challenge Oracle 2026

- Anna Bonfim — Mobile (React Native)
- Alane Rocha — API Java (Spring Boot)
- Duda Araujo — API .NET (ASP.NET Core)

---

Made with ❤️ using React Native, Expo, Spring Boot and ASP.NET Core
