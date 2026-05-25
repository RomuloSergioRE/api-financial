import { OpenAPIV3 } from 'openapi-types';

const bearerAuth: OpenAPIV3.SecuritySchemeObject = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Cole aqui o token JWT retornado no login para liberar os endpoints privados.',
};

const paginationParams: OpenAPIV3.ParameterObject[] = [
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Número da página' },
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Itens por página (máx: 100)' },
];

const paginationResponse: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: { type: 'array', items: { type: 'object' } },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  },
};

export function getSwaggerDocument(renderUrl?: string): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Financial API Backend 💸',
      description: 'Documentação interativa das rotas de gerenciamento financeiro, autenticação e relatórios.',
      version: '1.0.0',
    },
    servers: [
      ...(renderUrl ? [{ url: renderUrl, description: 'Produção (Render)' }] : []),
      { url: '/', description: 'Servidor Atual (Produção ou Local)' },
      { url: 'http://localhost:3000', description: 'Servidor Local de Desenvolvimento' },
    ],
    components: { securitySchemes: { bearerAuth } },
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
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                          role: { type: 'string' },
                          status: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '401': { description: 'Credenciais incorretas.' },
            '429': { description: 'Muitas tentativas (limite: 5/min).' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          summary: 'Renova o token JWT antes da expiração',
          tags: ['Autenticação'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token'],
                  properties: {
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Novo token gerado.' },
            '401': { description: 'Token inválido ou expirado.' },
          },
        },
      },

      // === TRANSAÇÕES ===
      '/transactions': {
        get: {
          summary: 'Lista todas as transações do usuário',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          parameters: paginationParams,
          responses: {
            '200': { description: 'Lista paginada retornada com sucesso.', content: { 'application/json': { schema: paginationResponse } } },
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
          responses: { '201': { description: 'Criado com sucesso.' }, '400': { description: 'Erro na validação dos dados.' } },
        },
      },
      '/transactions/{id}': {
        get: {
          summary: 'Detalha uma transação por ID',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Sucesso.' }, '404': { description: 'Transação não encontrada ou de outro usuário.' } },
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
                    description: { type: 'string', example: 'Energia Elétrica' },
                    type: { type: 'string', enum: ['income', 'outcome'] },
                    categoryId: { type: 'string' },
                    date: { type: 'string', example: '2026-05-21' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Atualizado.' }, '404': { description: 'Inexistente ou sem permissão.' } },
        },
        delete: {
          summary: 'Exclui de forma definitiva uma transação',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Removido com sucesso.' }, '404': { description: 'Inexistente ou sem permissão.' } },
        },
      },

      // === CATEGORIAS ===
      '/categories': {
        get: {
          summary: 'Lista as categorias do usuário',
          tags: ['Categorias'],
          security: [{ bearerAuth: [] }],
          parameters: paginationParams,
          responses: { '200': { description: 'Lista paginada retornada com sucesso.', content: { 'application/json': { schema: paginationResponse } } } },
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
                    icon: { type: 'string', example: 'gamepad' },
                    color: { type: 'string', example: '#FF5733' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Criado.' } },
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
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, icon: { type: 'string' }, color: { type: 'string' } } } } },
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

      // === ANALYTICS (usuário comum) ===
      '/analytics/balance': {
        get: {
          summary: 'Retorna balanço financeiro consolidado por filtros',
          tags: ['Métricas e Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date', example: '2026-01-01' }, description: 'Filtrar a partir desta data (YYYY-MM-DD)' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date', example: '2026-12-31' }, description: 'Filtrar até esta data (YYYY-MM-DD)' },
            { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por categoria específica' },
          ],
          responses: { '200': { description: 'Resultados analíticos calculados.' } },
        },
      },
      '/analytics/categories': {
        get: {
          summary: 'Retorna a divisão proporcional de gastos por categoria',
          tags: ['Métricas e Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date', example: '2026-01-01' }, description: 'Filtrar a partir desta data (YYYY-MM-DD)' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date', example: '2026-12-31' }, description: 'Filtrar até esta data (YYYY-MM-DD)' },
            { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por categoria específica' },
          ],
          responses: { '200': { description: 'Dados de share gerados.' } },
        },
      },

      // === ADMIN ===
      '/admin/users': {
        get: {
          summary: '[Admin] Lista todos os usuários',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            ...paginationParams,
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'user', 'company'] }, description: 'Filtrar por papel' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'suspended'] }, description: 'Filtrar por status' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Buscar por nome ou e-mail' },
          ],
          responses: { '200': { description: 'Lista paginada de usuários (sem senha).', content: { 'application/json': { schema: paginationResponse } } }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/users/{id}': {
        get: {
          summary: '[Admin] Detalha um usuário com estatísticas financeiras',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Detalhes do usuário + total de transações, receitas, despesas e saldo líquido.' }, '403': { description: 'Apenas admin.' }, '404': { description: 'Usuário não encontrado.' } },
        },
        delete: {
          summary: '[Admin] Remove (soft delete) um usuário',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Removido.' }, '400': { description: 'Não é permitido remover a própria conta.' }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/categories': {
        post: {
          summary: '[Admin] Cria uma categoria global (visível a todos)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'Freelance' }, icon: { type: 'string', example: 'briefcase' }, color: { type: 'string', example: '#4CAF50' } } } } },
          },
          responses: { '201': { description: 'Categoria global criada.' }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/categories/{id}': {
        put: {
          summary: '[Admin] Atualiza uma categoria global',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, icon: { type: 'string' }, color: { type: 'string' } } } } },
          },
          responses: { '200': { description: 'Atualizada.' }, '403': { description: 'Apenas admin.' } },
        },
        delete: {
          summary: '[Admin] Remove uma categoria global',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Removida.' }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/analytics/overview': {
        get: {
          summary: '[Admin] Visão geral da plataforma (dashboard)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Total de usuários, ativos, transações, receitas, despesas e saldo líquido.' }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/analytics/users/{id}': {
        get: {
          summary: '[Admin] Métricas financeiras detalhadas de um usuário',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Balanço e distribuição por categorias do usuário.' }, '403': { description: 'Apenas admin.' }, '404': { description: 'Usuário não encontrado.' } },
        },
      },
    },
  };
};
