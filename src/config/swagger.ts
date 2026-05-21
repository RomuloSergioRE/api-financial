import { OpenAPIV3 } from 'openapi-types';

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Financial API Backend 💸',
    description: 'Documentação interativa das rotas de gerenciamento financeiro, autenticação e relatórios.',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local de Desenvolvimento',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Cole aqui o token JWT retornado no login para liberar os endpoints privados.',
      },
    },
  },
  paths: {
    // === AUTENTICAÇÃO ===
    '/auth/register': {
      post: {
        summary: 'Cadastra um novo usuário',
        tags: ['Autenticação'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'senha123456' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Usuário registrado com sucesso.' },
          '400': { description: 'Dados inválidos ou e-mail já em uso.' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Realiza a autenticação do usuário',
        tags: ['Autenticação'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'senha123456' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Autenticado com sucesso.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                  },
                },
              },
            },
          },
          '401': { description: 'Credenciais incorretas.' },
        },
      },
    },

    // === TRANSAÇÕES ===
    '/transactions': {
      get: {
        summary: 'Lista todas as transações do usuário',
        tags: ['Transações'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista retornada com sucesso.' },
          '401': { description: 'Token JWT ausente ou expirado.' },
        },
      },
      post: {
        summary: 'Cria uma nova movimentação financeira',
        tags: ['Transações'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'description', 'date', 'type', 'categoryId'],
                properties: {
                  amount: { type: 'number', example: 450.00 },
                  description: { type: 'string', example: 'Energia Elétrica' },
                  date: { type: 'string', example: '2026-05-21' },
                  type: { type: 'string', enum: ['income', 'outcome'], example: 'outcome' },
                  categoryId: { type: 'string', example: '751a845c-53a0-40a7-8e65-2b4ff5b36d8d' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Criado com sucesso.' },
          '400': { description: 'Erro na validação do Zod.' },
        },
      },
    },
    '/transactions/{id}': {
      get: {
        summary: 'Detalha uma transação por ID',
        tags: ['Transações'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Sucesso.' },
          '404': { description: 'Transação não encontrada ou de outro usuário.' },
        },
      },
      put: {
        summary: 'Atualiza dados de uma transação existente',
        tags: ['Transações'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number', example: 500.00 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Atualizado.' },
          '404': { description: 'Inexistente ou sem permissão.' },
        },
      },
      delete: {
        summary: 'Exclui de forma definitiva uma transação',
        tags: ['Transações'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Removido com sucesso.' },
          '404': { description: 'Inexistente ou sem permissão.' },
        },
      },
    },

    // === CATEGORIAS ===
    '/categories': {
      get: {
        summary: 'Lista as categorias do usuário',
        tags: ['Categorias'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Sucesso.' },
        },
      },
      post: {
        summary: 'Cria uma nova categoria personalizada',
        tags: ['Categorias'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Lazer' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Criado.' },
        },
      },
    },
    '/categories/{id}': {
      get: {
        summary: 'Detalha uma categoria',
        tags: ['Categorias'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Sucesso.' } },
      },
      put: {
        summary: 'Modifica uma categoria',
        tags: ['Categorias'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Alterado.' } },
      },
      delete: {
        summary: 'Remove uma categoria',
        tags: ['Categorias'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Deletado.' } },
      },
    },

    // === ANALYTICS ===
    '/analytics/balance': {
      get: {
        summary: 'Retorna balanço financeiro consolidado por filtros',
        tags: ['Métricas e Analytics'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Resultados analíticos calculados.' },
        },
      },
    },
    '/analytics/categories': {
      get: {
        summary: 'Retorna a divisão proporcional de gastos por categoria',
        tags: ['Métricas e Analytics'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dados de share gerados.' },
        },
      },
    },
  },
};