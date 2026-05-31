<div align="center">

# 💰 Financial API

API REST para gerenciamento financeiro pessoal com autenticação JWT, transações por categorias, analytics consolidados, painel administrativo e documentação interativa Swagger.

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

- **Autenticação segura** — Registro e login com senhas hashizadas (bcrypt) e tokens JWT
- **Refresh token** — Renovação do JWT sem novo login
- **CRUD de transações** — Receitas e despesas vinculadas a categorias, com valores em centavos (INTEGER)
- **CRUD de categorias** — Categorias por usuário com suporte a categorias globais do sistema
- **Analytics financeiros** — Saldo consolidado e distribuição percentual de gastos por categoria, com filtros por data e categoria
- **Painel admin** — Gerenciamento de usuários (status, papel, remoção), categorias globais e visão geral da plataforma
- **Auditoria admin** — Registro de ações administrativas (alteração de status, papel, remoção de usuários)
- **Soft delete** — Todos os registros usam deleção lógica (paranoid), preservando histórico
- **Paginação** — Listagens paginadas com `page` e `limit` para evitar sobrecarga
- **Validação de entrada** — Schemas Zod em todos os endpoints com mensagens de erro descritivas
- **Rate limiting específico** — Login limitado a 5 tentativas/minuto por IP
- **CSP ativo** — Content-Security-Policy configurado via Helmet (compatível com Swagger UI)
- **Status no JWT** — Token contém status do usuário para verificação rápida sem consulta ao banco
- **Documentação interativa** — Swagger UI disponível em `/api-docs`

---

## Tecnologias

| Tecnologia | Propósito |
|---|---|
| **Node.js** | Ambiente de execução |
| **TypeScript** | Tipagem estática e segurança em tempo de compilação |
| **Express** | Framework web com middleware pipeline (Helmet, CORS, Rate Limit) |
| **PostgreSQL** | Banco de dados relacional |
| **Sequelize** | ORM com modelos, associações e soft delete |
| **JWT + bcrypt** | Autenticação stateless e hash de senhas |
| **Zod** | Validação de schemas de entrada com tipagem inferida |
| **Helmet** | Headers de segurança HTTP |
| **express-rate-limit** | Rate limiting por IP |
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

- **Routes** — Definem os endpoints e aplicam middlewares (autenticação, autorização, rate limit)
- **Controllers** — Extraem dados da requisição, delegam ao service e montam a resposta
- **Services** — Regras de negócio, mapeamento para DTOs (remove campos sensíveis como `password`, `deletedAt`)
- **Repositories** — Abstração de acesso a dados, isolando o ORM da camada de negócio
- **Models** — Definições Sequelize com índices, associações e soft delete

---

## Endpoints

### Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/auth/register` | Cadastrar novo usuário | ❌ |
| `POST` | `/auth/login` | Login e retorno do JWT (rate limit: 5/min) | ❌ |
| `POST` | `/auth/refresh` | Renovar token JWT | ❌ |
| `GET` | `/auth/me` | Retorna dados do perfil do usuário logado | ✅ |
| `PUT` | `/auth/profile` | Atualizar nome e/ou email | ✅ |
| `PUT` | `/auth/password` | Alterar a senha | ✅ |

### Transações

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/transactions?page=&limit=` | Listar transações | ✅ |
| `POST` | `/transactions` | Criar transação | ✅ |
| `GET` | `/transactions/:id` | Detalhar transação | ✅ |
| `PUT` | `/transactions/:id` | Atualizar transação | ✅ |
| `DELETE` | `/transactions/:id` | Remover transação | ✅ |

### Categorias

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/categories?page=&limit=` | Listar categorias do usuário | ✅ |
| `POST` | `/categories` | Criar categoria | ✅ |
| `GET` | `/categories/:id` | Detalhar categoria | ✅ |
| `PUT` | `/categories/:id` | Atualizar categoria | ✅ |
| `DELETE` | `/categories/:id` | Remover categoria | ✅ |

### Analytics

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/analytics/balance?startDate=&endDate=&categoryId=` | Saldo consolidado | ✅ |
| `GET` | `/analytics/categories?startDate=&endDate=&categoryId=` | Distribuição por categoria | ✅ |

### Admin (requer role `admin`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/admin/users?page=&limit=&role=&status=&search=` | Listar todos os usuários |
| `GET` | `/admin/users/:id` | Detalhar usuário com estatísticas financeiras |
| `PATCH` | `/admin/users/:id/status` | Alterar status de um usuário |
| `PATCH` | `/admin/users/:id/role` | Alterar papel de um usuário |
| `DELETE` | `/admin/users/:id` | Remover (soft delete) um usuário |
| `POST` | `/admin/categories` | Criar categoria global |
| `PUT` | `/admin/categories/:id` | Atualizar categoria global |
| `DELETE` | `/admin/categories/:id` | Remover categoria global |
| `GET` | `/admin/analytics/overview` | Visão geral da plataforma |
| `GET` | `/admin/analytics/users/:id` | Métricas financeiras de um usuário |

Outros:

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/health` | Health check do servidor | ❌ |

---

## Segurança

- **Senhas** hashizadas com bcrypt (10 rounds)
- **JWT** sem fallback — variável de ambiente obrigatória na inicialização
- **Status no token** — auth middleware verifica status sem consultar banco
- **CORS** configurável via environment, restrito por padrão a localhost
- **SSL** configurável (`DB_USE_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`)
- **Rate limiting** global (100 req/15min) + específico no login (5/min)
- **CSP** ativo via Helmet com suporte a Swagger UI
- **Validação Zod** em todos os endpoints contra mass assignment e injeção
- **Auditoria** ações admin registradas em tabela `audit_logs`

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

> **Deploy no Render:** Configure as envs `NODE_ENV=production`, `DB_USE_SSL=true`, e as credenciais do Render PostgreSQL. O build command é `npm run build` e o start command `npm start`.

---

## Testes

Duas collections Postman estão disponíveis em [`/postman`](./postman):

### Financial - User
Fluxo completo do usuário comum (registro → login → CRUD → analytics) em [`Financial.postman_collection.json`](./postman/Financial.postman_collection.json). As variáveis `jwt_token`, `categoryId` e `transactionId` são preenchidas automaticamente pelos scripts de teste.

### Financial - Admin
Fluxo administrativo (login admin → gestão de usuários → categorias globais → analytics) em [`Financial-Admin.postman_collection.json`](./postman/Financial-Admin.postman_collection.json). A variável `admin_token` é preenchida automaticamente no login. Execute o seed com `npm run seed:admin` antes de testar.

---

## Links

- **Repositório:** [github.com/RomuloSergioRE/api-financial](https://github.com/RomuloSergioRE/api-financial)
- **Swagger:** [`/api-docs`](http://localhost:3000/api-docs) (local) ou [`https://api-financial-279h.onrender.com/api-docs`](https://api-financial-279h.onrender.com/api-docs) (produção)
