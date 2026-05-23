# Pedix 🍽️

Aplicativo mobile completo para gerenciamento de pedidos em restaurantes, desenvolvido com **React Native + Expo**. O Pedix nasceu da ideia de digitalizar o atendimento em mesa: em vez de chamar o garçom toda hora ou esperar por um cardápio impresso, o cliente faz tudo pelo próprio celular — escaneia o QR Code da mesa, navega pelo cardápio, tira dúvida com a assistente de IA **Tutti**, monta o pedido, acompanha o status em tempo real e paga a conta direto pelo app. O garçom enxerga todas as comandas abertas num dashboard e avança o status conforme prepara/entrega; o gerente administra cardápio (CRUD completo), categorias, avaliações e relatórios.

O sistema é organizado em **3 partes**: este app mobile (React Native + Expo) e **duas APIs** complementares — uma em **Java/Spring Boot** que serve o cardápio, categorias, avaliações, histórico e relatórios; e outra em **.NET 8** responsável por autenticação (JWT + BCrypt), clientes, garçons, mesas, pedidos, itens-pedido e pagamentos. As duas APIs estão deployadas em **Azure App Service** com CI/CD via GitHub Actions, então o avaliador consegue testar tudo de ponta a ponta sem subir backend local.

> Projeto do **Challenge Oracle 2026** da turma 2TDSPS da FIAP, desenvolvido pelo squad **CodeGirls** ao longo de 4 sprints (estrutura base → integração de APIs → autenticação e perfis → IA, pagamento e CI/CD).

---

## 🎯 Para o avaliador — em 5 passos

| # | Ação | Como fazer |
|---|---|---|
| 1 | Baixar APK | Link do Firebase (será enviado junto com a entrega) |
| 2 | Logar como **cliente** | `cliente@pedix.com` / `cliente123` → escanear/escolher Mesa 1 |
| 3 | Fazer pedido | Cardápio → adicionar 2-3 itens → carrinho → confirmar → ver em "Pedidos" |
| 4 | Logar como **garçom** | Logout → `garcom@pedix.com` / `garcom123` → Mesas → ver comanda → avançar status |
| 5 | Pagar (cliente) | Volta como cliente → "Pagar conta" → método → aprova → mesa libera automaticamente → app redireciona pra avaliação |

> **Logins extras**: Gerente é `admin@pedix.com` / `admin123` (acessa CRUD do cardápio, categorias, relatórios).
> **Quer mexer na API?** Swagger ao vivo em <https://pedix-dotnet-api-anna.azurewebsites.net/swagger> com roteiro pronto no [README da API](https://github.com/annabonfim/pedix-dotnet-api#-roteiro-de-teste--exemplos-prontos).

---

## 🚀 Evolução do Projeto

| Sprint | Foco | Status |
|--------|------|--------|
| **Sprint 1** | Estrutura base (5 telas, dados mockados, Expo Router, AsyncStorage) | ✅ Concluída |
| **Sprint 2** | Integração com API Java (cardápio + pedidos), edição/cancelamento, status em tempo real | ✅ Concluída |
| **Sprint 3** | Autenticação 3 perfis, painel do garçom, QR Code real, temas claro/escuro, perfil Gerente | ✅ Concluída |
| **Sprint 4** | Assistente de IA Tutti, integração .NET (pedidos/mesas/pagamentos), notificações, dashboard de comandas, autenticação real com JWT | ✅ Concluída |

---

## ✨ O que foi implementado na Sprint 4

| Bloco | Resumo técnico |
|---|---|
| 🔐 **Auth real (JWT + BCrypt)** | Login bate em `POST /api/auth/login-{cliente,garcom,admin}`, valida hash BCrypt e devolve JWT (HS256) com claim de role. Token guardado em AsyncStorage; `restoreSession` re-hidrata o usuário no boot. Cadastro de admin/garçom exige `AdminKey` no servidor. |
| 🤖 **Tutti — assistente de IA** | Chat flutuante (FAB) presente em todas as telas do cliente, controlado via `TuttiChatContext`. Notificação proativa "ainda em dúvida do que pedir?" dispara **1x por sessão** quando o cliente passa 20s no cardápio sem decidir. Guard por papel (admin/gerente não vê). |
| 💳 **Pagamento ponta-a-ponta** | Tela `pagamento.jsx` agrega itens da comanda, escolhe método (PIX/Crédito/Débito/Dinheiro), cria o registro `Pagamento` na API e aciona a aprovação automática (delay de 2.5s representando o tempo de uma maquininha). **O fluxo é totalmente persistido e funcional** — criação do pagamento, aprovação, atualização dos pedidos pra `FINALIZADO`, liberação da mesa e notificação local. **O que não está presente** é a integração com um gateway externo (PIX real do BCB, Stripe, Mercado Pago) — fora de escopo acadêmico, exigiria CNPJ, certificado e tarifas. |
| 🟢 **Status FINALIZADO no fluxo de pedido** | Novo estado terminal que separa "comida entregue" (ENTREGUE) de "conta paga + fechada" (FINALIZADO). Fluxo: `ABERTO → EM_PREPARO → PRONTO → ENTREGUE` (garçom) → `FINALIZADO` (via pagamento aprovado). Resolve a sobrecarga semântica antiga onde ENTREGUE valia pra dois estados diferentes. |
| 📜 **Histórico inline no home com pagamento** | Estilo iFood: o home do cliente mostra cards dos 3 últimos pedidos finalizados com método de pagamento ("Pago via Pix R$ 50") — busca o pagamento via `GET /pagamentos/pedido/{id}`. Tap leva pra `/historico` completo. |
| ⭐ **Fluxo pós-pagamento → avaliação** | Após "Pagamento aprovado", o app redireciona pra `/avaliacao-form` em vez de jogar o cliente pra home. Momento natural pra pedir feedback (cliente saiu satisfeito, pagou) — padrão de apps tipo iFood/Uber. |
| 👁️ **Toggle de visibilidade da senha** | Ícone de olhinho ao lado do campo Senha em login e signup — tap alterna entre bolinhas e texto. Ajuda quem digitou errado sem precisar apagar tudo. |
| 🪑 **Mesa auto-status** | Backend mantém status coerente sozinho: criar pedido → `OCUPADA`; entregar último pedido → `LIVRE`; cancelar pedido → mesa **continua** ocupada (cliente pode estar trocando o que pediu). |
| 🛎️ **Dashboard de comandas (garçom)** | `admin/mesas.jsx` redesenhada: cada card de mesa ocupada mostra os itens da comanda agregados, total e contagem de pedidos. Click → `mesa-pedidos.jsx` permite avançar status de cada pedido (`ABERTO → EM_PREPARO → PRONTO → ENTREGUE`). |
| 🔔 **Notificações locais** | `expo-notifications` com canal Android dedicado, foreground + background. Disparadas em: mudança de status de pedido, pagamento aprovado e Tutti proativo. Tap na notificação navega pra tela relevante. |
| ⭐ **Avaliações** | Cliente avalia pedidos/itens (1–5 estrelas + comentário). Listagem visível pra todos os perfis; gerente pode deletar. |
| 🕐 **Histórico de pedidos** | Tela `/historico` adapta o conteúdo por papel: **cliente** vê só os pedidos dele (com status, mesa, total); **garçom/gerente** vê todos do sistema (auditoria do que rolou no restaurante). Linkada no home do cliente como "Pedidos" (atalho) — não conflita com a tab "Pedidos" do bottom menu, que mostra só a comanda em aberto. |
| 📱 **Tela "Sobre o App"** | Mostra versão + hash do commit, injetado em build via `app.config.js` lendo `git rev-parse --short HEAD`. Atende ao requisito de identificação da versão publicada. |
| 📊 **Telas administrativas (gerente)** | CRUD de categorias, lista de relatórios, gestão de avaliações. |

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

## 🧠 Decisões de design

| Decisão | Por quê |
|---|---|
| **Comanda por cliente, não por mesa** | Cada cliente loga no próprio celular, então cada um tem sua sequência de pedidos. Garante privacidade (cliente A não vê o que B pediu), pagamento individual (sem dividir conta) e a mesa serve só como "onde entregar". O garçom enxerga tudo agregado pela mesa no dashboard. |
| **Mesa libera só com `FINALIZADO` (pagamento), não com `ENTREGUE` nem `CANCELADO`** | ENTREGUE significa "comida na mesa, conta em aberto" — cliente ainda precisa pagar. Cancelar item também não libera (cliente provavelmente vai pedir outra coisa). Só FINALIZADO (=pagamento aprovado pelo backend) fecha a conta de fato e devolve a mesa pra LIVRE. |
| **`DateTime` UTC no banco, conversão no app** | API .NET serializa `DateTime` UTC sem o `Z` final; o `Date` do JS interpretaria como hora local e geraria offset de 3h no Brasil. Helper `parseAsUtc` em [utils/time.js](utils/time.js) anexa o `Z` quando ausente. Resultado: "criado há 4 min" bate com o relógio do celular. |
| **Mesa salva como `numero` (UI) + `Guid` (storage)** | A UI mostra número humano (1, 2, 3...), mas a API .NET exige `Guid`. `scan.jsx` resolve o `Guid` via `GET /api/mesas` no momento do scan e salva ambos no `AsyncStorage` (`TABLE_NUMBER` e `MESA_ID`). |
| **Limpar mesa só em login/logout explícito** | `restoreSession` no boot do app **não** reseta a mesa (cliente recarrega sem perder contexto). Mas login/register/logout limpam (sessão nova = mesa nova). |
| **Tutti proativo em flag de módulo, não state local** | Garante "1x por sessão" mesmo com remounts de `menu.jsx` (sair pro carrinho e voltar). `useRef` zeraria; flag módulo só zera quando o bundle JS recarrega. |
| **`getDefaultGarcomId` com fallback** | App não obriga o cliente a escolher garçom — pega o 1º ativo da lista. Cache em memória pra não bater `GET /garcons` toda vez. |

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
└── historico.jsx          Pedidos passados (próprios do cliente; geral pro garçom/gerente)

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

> A leitura de QR Code precisa de câmera (dispositivo físico ou emulador com webcam-passthrough tipo Genymotion). No emulador padrão Android, use a **entrada manual** de mesa (1 a 10) na tela `/scan` — a validação aceita só esse range.

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
- `a` para emulador Android · `i` para simulador iOS

> ⚠️ Não roda em browser (`w`) — o app depende de `expo-camera`, `expo-notifications` e AsyncStorage nativo. Use sempre Expo Go ou emulador.

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
- Mesas de **1 a 10** (validado em `scan.jsx` — números fora desse range são rejeitados)
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
│   ├── historico.jsx             Pedidos passados (cliente vê só os dele, staff vê todos)
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
│   ├── csharpAPi.js              Cliente HTTP da API .NET (Azure) 🆕
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
