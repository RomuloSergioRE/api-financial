<div align="center">

# 💰 Financial API

API REST para gerenciamento financeiro pessoal e empresarial com autenticação JWT, CRUD de transações/categorias/tags, orçamentos, metas, regras recorrentes, analytics consolidados, suporte multi-usuário (organizações), painel administrativo e documentação interativa Swagger.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?logo=sequelize&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-blue)

</div>

---

## Funcionalidades

- **Autenticação JWT com refresh token rotation** — Registro, login (access token 15min + refresh token 7d single-use), refresh com rotação e detecção de roubo (token families), logout real, perfil e alteração de senha com revogação em cascata
- **Transações** — CRUD completo com exportação CSV/PDF, importação CSV, template de importação e link/unlink de tags
- **Categorias** — CRUD de categorias pessoais + globais (admin), exportação CSV/PDF e importação CSV
- **Tags** — CRUD de tags com link/unlink em transações (relação N:N)
- **Orçamentos (Budgets)** — CRUD com recálculo automático do spent ao criar/atualizar/deletar transações
- **Metas (Goals)** — CRUD com progress tracking automático baseado no saldo das contas
- **Regras Recorrentes** — CRUD + execução manual e scheduler automático (node-cron) que gera transações com base em regras diárias/semanais/mensais/anuais
- **Analytics avançado** — Saldo consolidado, distribuição por categoria, série mensal, comparação entre períodos, top categorias, resumo executivo e projeção de cash flow, com exportação CSV/PDF
- **Empresa/Multi-usuário (Organizações)** — CRUD, seleção de contexto, convite/aceite de membros, níveis de papel (owner/admin/member/financial) e relatório fiscal
- **Painel Admin** — Gestão de usuários (status, papel, remoção), categorias globais, auditoria (audit logs), analytics da plataforma, exportação (usuários/transações/audit-logs CSV) e importação de transações CSV
- **Soft delete** — Todos os registros usam deleção lógica (paranoid), preservando histórico
- **Paginação** — Listagens paginadas com `page` e `limit` para evitar sobrecarga
- **Validação Zod** — Schemas em todos os endpoints com mensagens de erro descritivas
- **Rate limiting específico** — Limites diferenciados por rota (login, register, refresh, password, export, logout)
- **CSP ativo** — Content-Security-Policy configurado via Helmet (compatível com Swagger UI)
- **Access token curto (15min)** — Janela de ataque reduzida; refresh token opaco armazenado no DB com hash SHA-256
- **Documentação interativa** — Swagger UI disponível em `/api-docs`

---

## Tecnologias

| Tecnologia | Propósito |
|---|---|
| **Node.js** | Ambiente de execução |
| **TypeScript** | Tipagem estática e segurança em tempo de compilação |
| **Express 5** | Framework web com middleware pipeline (Helmet, CORS, Rate Limit) |
| **PostgreSQL** | Banco de dados relacional |
| **Sequelize** | ORM com modelos, associações e soft delete (paranoid) |
| **JWT + bcrypt** | Autenticação stateless e hash de senhas (10 rounds) |
| **Zod** | Validação de schemas de entrada com tipagem inferida |
| **Helmet** | Headers de segurança HTTP (CSP, X-Content-Type-Options, etc.) |
| **express-rate-limit** | Rate limiting por IP |
| **multer** | Upload de arquivos (importação CSV, limite 5MB) |
| **csv-parse / csv-stringify** | Leitura e geração de arquivos CSV |
| **PDFKit** | Geração de relatórios PDF |
| **node-cron** | Scheduler automático para regras recorrentes |
| **umzug** | Gerenciamento de migrações do banco de dados |
| **Swagger UI** | Documentação OpenAPI interativa |

---

## Arquitetura

O projeto segue uma arquitetura em camadas com separação clara de responsabilidades:

```
┌──────────┐     ┌────────────┐     ┌──────────┐     ┌──────────────┐     ┌───────────┐
│  Routes  │────▶│Controllers │────▶│ Services │────▶│ Repositories │────▶│  Models   │
└──────────┘     └────────────┘     └──────────┘     └──────────────┘     └───────────┘
                                                                                │
                                                                          ┌──────▼──────┐
                                                                          │ PostgreSQL  │
                                                                          └─────────────┘
```

- **Routes** — Definem os endpoints e aplicam middlewares (autenticação, autorização, rate limit, upload)
- **Controllers** — Extraem dados da requisição, delegam ao service e montam a resposta HTTP
- **Services** — Regras de negócio, cálculo de spent (budgets), progress (goals), execução de regras recorrentes, export/import, contexto de organização
- **Repositories** — Abstração de acesso a dados, isolando o ORM da camada de negócio
- **Models** — Definições Sequelize com índices, associações e soft delete (paranoid)

### Módulos adicionais

- **Export/Import Service** — Geração de CSV/PDF via csv-stringify e PDFKit, parse de CSV via csv-parse com multer para upload
- **Recurring Scheduler** — Worker node-cron que verifica regras recorrentes vencidas e gera transações automaticamente
- **Org Context Resolver** — Middleware/utils que resolve a organização ativa do usuário para isolar dados por contexto

---

## Endpoints

### Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/auth/register` | Cadastrar novo usuário (rate limit: 3/min) | ❌ |
| `POST` | `/auth/login` | Login e retorno do JWT (rate limit: 5/min) | ❌ |
| `POST` | `/auth/refresh` | Renovar access token usando refresh token (rate limit: 10/min) | ❌ |
| `POST` | `/auth/logout` | Encerrar sessão e invalidar refresh token | ✅ |
| `GET` | `/auth/me` | Retorna dados do perfil do usuário logado | ✅ |
| `PUT` | `/auth/profile` | Atualizar nome e/ou email | ✅ |
| `PUT` | `/auth/password` | Alterar a senha (rate limit: 3/min) | ✅ |

### Transações

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/transactions?page=&limit=` | Listar transações paginadas | ✅ |
| `POST` | `/transactions` | Criar transação | ✅ |
| `GET` | `/transactions/:id` | Detalhar transação | ✅ |
| `PUT` | `/transactions/:id` | Atualizar transação | ✅ |
| `DELETE` | `/transactions/:id` | Remover transação (soft delete) | ✅ |
| `GET` | `/transactions/export/csv` | Exportar transações como CSV | ✅ |
| `GET` | `/transactions/export/pdf` | Exportar transações como PDF | ✅ |
| `GET` | `/transactions/export/template` | Baixar template CSV para importação | ✅ |
| `POST` | `/transactions/import/csv` | Importar transações via CSV (multipart) | ✅ |
| `POST` | `/transactions/:id/tags` | Adicionar tags a uma transação | ✅ |
| `DELETE` | `/transactions/:id/tags/:tagId` | Remover tag de uma transação | ✅ |

### Categorias

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/categories?page=&limit=` | Listar categorias do usuário | ✅ |
| `POST` | `/categories` | Criar categoria | ✅ |
| `GET` | `/categories/:id` | Detalhar categoria | ✅ |
| `PUT` | `/categories/:id` | Atualizar categoria | ✅ |
| `DELETE` | `/categories/:id` | Remover categoria (soft delete) | ✅ |
| `GET` | `/categories/export/csv` | Exportar categorias como CSV | ✅ |
| `GET` | `/categories/export/pdf` | Exportar categorias como PDF | ✅ |
| `POST` | `/categories/import/csv` | Importar categorias via CSV (multipart) | ✅ |

### Tags

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/tags?page=&limit=` | Listar tags | ✅ |
| `POST` | `/tags` | Criar tag | ✅ |
| `GET` | `/tags/:id` | Detalhar tag | ✅ |
| `PUT` | `/tags/:id` | Atualizar tag | ✅ |
| `DELETE` | `/tags/:id` | Remover tag (soft delete) | ✅ |

### Orçamentos (Budgets)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/budgets?page=&limit=` | Listar orçamentos | ✅ |
| `POST` | `/budgets` | Criar orçamento | ✅ |
| `GET` | `/budgets/:id` | Detalhar orçamento (com spent calculado) | ✅ |
| `PUT` | `/budgets/:id` | Atualizar orçamento | ✅ |
| `DELETE` | `/budgets/:id` | Remover orçamento (soft delete) | ✅ |

### Metas (Goals)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/goals?page=&limit=` | Listar metas | ✅ |
| `POST` | `/goals` | Criar meta | ✅ |
| `GET` | `/goals/:id` | Detalhar meta (com progress calculado) | ✅ |
| `PUT` | `/goals/:id` | Atualizar meta | ✅ |
| `DELETE` | `/goals/:id` | Remover meta (soft delete) | ✅ |

### Regras Recorrentes

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/recurring?page=&limit=` | Listar regras recorrentes | ✅ |
| `POST` | `/recurring` | Criar regra recorrente | ✅ |
| `GET` | `/recurring/:id` | Detalhar regra recorrente | ✅ |
| `PUT` | `/recurring/:id` | Atualizar regra recorrente | ✅ |
| `DELETE` | `/recurring/:id` | Remover regra recorrente (soft delete) | ✅ |
| `POST` | `/recurring/:id/execute` | Executar regra manualmente (gera transação) | ✅ |

### Organizações

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/organizations` | Criar organização | ✅ |
| `GET` | `/organizations` | Listar organizações do usuário | ✅ |
| `GET` | `/organizations/:id` | Detalhar organização | ✅ |
| `PUT` | `/organizations/:id` | Atualizar organização | ✅ |
| `DELETE` | `/organizations/:id` | Remover organização (soft delete) | ✅ |
| `PATCH` | `/organizations/:id/select` | Selecionar organização como contexto ativo | ✅ |
| `PATCH` | `/organizations/select-none` | Remover seleção de organização (modo pessoal) | ✅ |
| `GET` | `/organizations/:id/members` | Listar membros da organização | ✅ |
| `POST` | `/organizations/:id/members` | Convidar membro para organização | ✅ |
| `PATCH` | `/organizations/:id/members/:memberId/accept` | Aceitar convite | ✅ |
| `PUT` | `/organizations/:id/members/:memberId/role` | Alterar papel de membro | ✅ |
| `DELETE` | `/organizations/:id/members/:memberId` | Remover membro | ✅ |
| `GET` | `/organizations/:id/fiscal-report` | Relatório fiscal da organização | ✅ |

### Analytics

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/analytics/balance?startDate=&endDate=&categoryId=` | Saldo consolidado (receitas - despesas) | ✅ |
| `GET` | `/analytics/categories?startDate=&endDate=&categoryId=` | Distribuição percentual por categoria | ✅ |
| `GET` | `/analytics/monthly-series?startDate=&endDate=` | Série mensal de receitas/despesas | ✅ |
| `GET` | `/analytics/comparison?startDate=&endDate=&compareStart=&compareEnd=` | Comparação entre dois períodos | ✅ |
| `GET` | `/analytics/top-categories?startDate=&endDate=&limit=` | Top categorias por valor | ✅ |
| `GET` | `/analytics/summary?startDate=&endDate=` | Resumo executivo (totais, médias, saldo) | ✅ |
| `GET` | `/analytics/cash-flow?startDate=&endDate=` | Projeção de fluxo de caixa | ✅ |
| `GET` | `/analytics/export/csv` | Exportar analytics como CSV | ✅ |
| `GET` | `/analytics/export/pdf` | Exportar analytics como PDF | ✅ |

### Admin (requer role `admin`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/admin/users?page=&limit=&role=&status=&search=` | Listar todos os usuários |
| `GET` | `/admin/users/:id` | Detalhar usuário com estatísticas financeiras |
| `PATCH` | `/admin/users/:id/status` | Alterar status de um usuário |
| `PATCH` | `/admin/users/:id/role` | Alterar papel de um usuário |
| `DELETE` | `/admin/users/:id` | Remover (soft delete) um usuário |
| `GET` | `/admin/categories` | Listar categorias globais |
| `POST` | `/admin/categories` | Criar categoria global |
| `PUT` | `/admin/categories/:id` | Atualizar categoria global |
| `DELETE` | `/admin/categories/:id` | Remover categoria global |
| `GET` | `/admin/audit-logs?page=&limit=&action=&userId=` | Listar logs de auditoria |
| `GET` | `/admin/analytics/overview` | Visão geral da plataforma |
| `GET` | `/admin/analytics/users/:id` | Métricas financeiras de um usuário |
| `GET` | `/admin/analytics/user-growth?startDate=&endDate=` | Crescimento de cadastros |
| `GET` | `/admin/analytics/performance?startDate=&endDate=` | Performance da plataforma |
| `GET` | `/admin/export/users/csv` | Exportar usuários como CSV |
| `GET` | `/admin/export/transactions/csv` | Exportar todas as transações como CSV |
| `GET` | `/admin/export/audit-logs/csv` | Exportar audit logs como CSV |
| `POST` | `/admin/import/transactions/csv` | Importar transações CSV (multipart) |

### Health Check

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/health` | Health check do servidor | ❌ |

---

## Segurança

- **Senhas hasheadas** com bcrypt (10 rounds)
- **Refresh token rotation** — Access tokens de curta duração (15min), refresh tokens opacos de 7 dias (single-use via hash SHA-256) com detecção de roubo: se um refresh token já usado for reapresentado, toda a família de tokens é revogada
- **Logout real** — `POST /auth/logout` deleta o refresh token do banco de dados, encerrando a sessão efetivamente
- **Troca de senha com revogação** — Ao alterar a senha, todos os refresh tokens do usuário são deletados, forçando re-login em todos os dispositivos
- **Password complexity** — Mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula e um dígito
- **CORS configurável** — Via variável de ambiente `CORS_ORIGIN`, restrito por padrão a localhost
- **CSP via Helmet** — Content-Security-Policy configurado com suporte a Swagger UI (CDN allowlist)
- **Rate limiting**:
  - Global: 100 requisições a cada 15 minutos
  - Login: 5 tentativas por minuto
  - Register: 3 tentativas por minuto
  - Refresh: 10 tentativas por minuto
  - Password change: 3 tentativas por minuto
  - Logout: 10 tentativas por minuto
  - Export: 20 requisições a cada 15 minutos
- **File upload limit** — 5MB via multer (importação CSV)
- **Validação Zod** — Schemas de entrada em todos os endpoints contra mass assignment e injeção
- **Soft delete** — Todos os modelos usam `paranoid: true` no Sequelize, preservando histórico
- **Auditoria admin** — Ações administrativas registradas em tabela `audit_logs` (tipo, alvo, descrição)

---

## Como Rodar Localmente

```bash
# 1. Clone
git clone https://github.com/RomuloSergioRE/api-financial.git
cd api-financial

# 2. Instale as dependências
npm install

# 3. Configure o .env (veja .env.example)
cp .env.example .env

# 4. Inicie o servidor
npm run dev
```

Acesse a documentação Swagger em [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

> **Deploy no Render:** Configure as envs `NODE_ENV=production`, `DB_USE_SSL=true`, e as credenciais do Render PostgreSQL. O build command é `npm run build` e o start command `npm start`. As envs de JWT são `JWT_ACCESS_EXPIRES_IN=15m` e `JWT_REFRESH_EXPIRES_IN=7` (dias).

---

## Testes

Duas collections Postman estão disponíveis em [`/postman`](./postman):

### Financial - User

Fluxo completo do usuário comum em [`Financial.postman_collection.json`](./postman/Financial.postman_collection.json). A collection executa toda a jornada:

```
Registro → Login → Refresh token → Logout → Criar categorias → CRUD transações (com export/import CSV e PDF) → CRUD tags → Link/unlink tags em transações → CRUD orçamentos (com spent automático) → CRUD metas (com progress tracking) → CRUD regras recorrentes → Execução manual de regra → CRUD organizações → Convidar/aceitar membro → Relatório fiscal → Todos os endpoints de analytics
```

As variáveis `jwt_token`, `refresh_token`, `categoryId`, `transactionId`, `tagId`, `budgetId`, `goalId`, `recurringId`, `orgId` são preenchidas automaticamente pelos scripts de teste.

### Financial - Admin

Fluxo administrativo em [`Financial-Admin.postman_collection.json`](./postman/Financial-Admin.postman_collection.json):

```
Login admin → Gestão de usuários (listar, detalhar, alterar status/papel) → CRUD categorias globais → Audit logs → Analytics da plataforma (overview, usuário, crescimento, performance) → Exportar usuários/transações/audit-logs CSV → Importar transações CSV
```

A variável `admin_token` é preenchida automaticamente no login. Execute o seed com `npm run seed:admin` antes de testar.

### Data Isolation

Com o módulo de organizações, é possível testar o isolamento de dados entre diferentes contextos (pessoal vs. organização), garantindo que transações, categorias, tags, orçamentos, metas e regras recorrentes de uma organização não sejam visíveis em outra.

---

## Links

- **Repositório:** [github.com/RomuloSergioRE/api-financial](https://github.com/RomuloSergioRE/api-financial)
- **Swagger:** [`/api-docs`](http://localhost:3000/api-docs) (local) ou [`https://api-financial-279h.onrender.com/api-docs`](https://api-financial-279h.onrender.com/api-docs) (produção)
