# 💰 API de Controle Financeiro Pessoal

Uma API REST completa para gerenciamento e controle de finanças pessoais, desenvolvida com Node.js, TypeScript e PostgreSQL. O projeto conta com autenticação segura, controle de transações, agrupamento por categorias, relatórios analíticos e documentação totalmente interativa com Swagger.

## 🚀 Links do Projeto
* **Repositório Oficial:** [Link para o repositório](https://github.com/RomuloSergioRE/api-financial)
* **Documentação Interativa (Swagger):** [Acesse a API no Render](https://SUA-URL-DO-RENDER.onrender.com/api-docs) *(Substitua com o link do Render após o deploy)*

> 💡 **Nota sobre o deploy:** O backend está hospedado no plano gratuito do Render. Caso o primeiro acesso à documentação demore cerca de 1 minuto para carregar, é apenas o servidor acordando do modo de espera (*spin down*). Os acessos seguintes serão instantâneos!

---

## 🛠️ Tecnologias e Ferramentas Utilizadas

* **Ambiente de Execução:** Node.js (v20+)
* **Linguagem:** TypeScript
* **Framework Web:** Express
* **Banco de Dados:** PostgreSQL
* **ORM (Mapeamento do Banco):** Sequelize
* **Segurança & Autenticação:** JWT (JSON Web Tokens), Bcrypt, Helmet, Express Rate Limit
* **Documentação:** Swagger UI Express

---

## 🛡️ Diferenciais e Boas Práticas Aplicadas

Este projeto foi construído seguindo padrões rigorosos de mercado e segurança para ambientes de produção:

* **Arquitetura Limpa:** Separação clara de responsabilidades entre Rotas, Controllers, Services e Models.
* **Segurança de Cabeçalhos (Helmet):** Proteção automática contra ataques comuns como XSS e Clickjacking.
* **Proteção contra Sobrecarga (Rate Limiting):** Limitador de requisições por IP instalado globalmente para evitar ataques de força bruta e negação de serviço (DoS).
* **Controle de Payload:** Limitação estrita do tamanho de JSONs aceitos pela API (máximo 10kb) para proteger a memória do servidor contra travamentos.
* **Ambientes Isolados:** Banco de Dados configurado com criptografia SSL dinâmica apenas para produção e sincronização de tabelas (`{ alter: true }`) travada e permitida exclusivamente em ambiente de desenvolvimento.

---

## 🗺️ Estrutura Completa de Endpoints (Rotas)

Todas as rotas abaixo (exceto as de autenticação) exigem o envio do Token JWT no cabeçalho da requisição (`Authorization: Bearer <TOKEN>`).

* **Autenticação (`/auth`)**
  * `POST /auth/register` - Cadastro de novos usuários (com hash de senha seguro).
  * `POST /auth/login` - Login de usuários e geração do Token JWT.

* **Categorias (`/categories`)**
  * `GET /categories` - Lista todas as categorias do usuário autenticado.
  * `POST /categories` - Cria uma nova categoria.
  * `GET /categories/:id` - Busca os detalhes de uma categoria específica pelo ID.
  * `PUT /categories/:id` - Atualiza os dados de uma categoria existente.
  * `DELETE /categories/:id` - Remove uma categoria do sistema.

* **Transações (`/transactions`)**
  * `GET /transactions` - Lista todo o histórico de receitas e despesas do usuário.
  * `POST /transactions` - Cadastra uma nova movimentação financeira.
  * `GET /transactions/:id` - Busca os detalhes de uma transação específica pelo ID.
  * `PUT /transactions/:id` - Atualiza os dados de uma transação existente.
  * `DELETE /transactions/:id` - Remove uma transação do sistema.

* **Análises e Relatórios (`/analytics`)**
  * `GET /analytics/balance` - Retorna o saldo consolidado do usuário.
  * `GET /analytics/categories` - Retorna a distribuição e participação de gastos por categoria.

---

---

## 🧪 Testes Automatizados com Postman

A coleção de testes ponta a ponta está configurada e disponível diretamente no repositório para validação rápida dos fluxos da API.

* **Arquivo da Coleção:** [Acessar coleção JSON](./postman/Financial.postman_collection.json)

### Como utilizar a coleção:

1. Abra o seu Postman e clique em **Import**.
2. Selecione o arquivo `Financial.postman_collection.json` localizado na pasta `/postman`.
3. Configure o seu **Postman Environment** com as seguintes variáveis globais:
   * `baseUrl`: Endereço da API (Ex: `http://localhost:3000` ou a URL do Render).
   * `jwt_token`: Deixe em branco (será preenchida automaticamente no login).
   * `categoryId`: Deixe em branco (será preenchida automaticamente ao criar uma categoria).
   * `transactionId`: ID gerado ao criar transações.

> 💡 **Fluxo inteligente:** A rota de `Login` e de `Create Category` possuem scripts de teste pré-configurados que capturam os tokens e IDs de resposta do servidor e salvam de forma dinâmica nas variáveis do ambiente, dispensando a necessidade de copiar e colar chaves manualmente.

## 💻 Como Rodar o Projeto Localmente

Siga o passo a passo abaixo para clonar e rodar o projeto na sua máquina:

### 1. Clonar o Repositório
```bash
git clone https://github.com/RomuloSergioRE/api-financial.git
cd api-financial
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
#### Crie um arquivo chamado .env na raiz do seu projeto e preencha com as suas configurações locais

```env
PORT=
NODE_ENV=

# Configurações do seu Banco PostgreSQL Local
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
DB_PORT=

# Configurações do Token
JWT_SECRET=
JWT_EXPIRES_IN=

```
### 4. Executar a Aplicação em Modo de Desenvolvimento

```bash
npm run dev
```
#### O servidor iniciará localmente e a documentação interativa estará disponível em: http://localhost:3000/api-docs