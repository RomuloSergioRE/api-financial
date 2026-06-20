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
                      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                      refreshToken: { type: 'string', example: 'a1b2c3d4e5f678901234567890abcdef' },
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
          summary: 'Renova o access token usando refresh token (rotação)',
          tags: ['Autenticação'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string', example: 'a1b2c3d4e5f678901234567890abcdef' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Novos tokens gerados (o refresh token anterior é invalidado).',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                      refreshToken: { type: 'string', example: 'b2c3d4e5f678901234567890abcdef01' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Refresh token inválido, expirado ou reusado (ataque detectado).' },
          },
        },
      },
      '/auth/logout': {
        post: {
          summary: 'Encerra a sessão e invalida o refresh token',
          tags: ['Autenticação'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string', example: 'a1b2c3d4e5f678901234567890abcdef' },
                  },
                },
              },
            },
          },
          responses: {
            '204': { description: 'Sessão encerrada com sucesso.' },
            '400': { description: 'Dados inválidos.' },
            '401': { description: 'Token JWT ou refresh token inválido.' },
          },
        },
      },
      '/auth/avatar': {
        post: {
          summary: 'Faz upload da foto do perfil (avatar)',
          tags: ['Autenticação'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    avatar: { type: 'string', format: 'binary', description: 'Imagem (máx: 2MB, formatos: jpg/png/gif/webp)' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Avatar atualizado com sucesso.' },
            '400': { description: 'Arquivo inválido ou muito grande.' },
            '401': { description: 'Token JWT ausente ou expirado.' },
          },
        },
        delete: {
          summary: 'Remove a foto do perfil (avatar)',
          tags: ['Autenticação'],
          security: [{ bearerAuth: [] }],
          responses: {
            '204': { description: 'Avatar removido com sucesso.' },
            '401': { description: 'Token JWT ausente ou expirado.' },
          },
        },
      },
      '/auth/settings': {
        put: {
          summary: 'Atualiza configurações de moeda e localidade do usuário',
          tags: ['Autenticação'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currency: { type: 'string', enum: ['BRL', 'USD', 'EUR'], example: 'BRL', description: 'Moeda padrão' },
                    locale: { type: 'string', enum: ['pt-BR', 'en-US', 'es-ES'], example: 'pt-BR', description: 'Localidade' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Configurações atualizadas com sucesso.' },
            '400': { description: 'Dados inválidos.' },
            '401': { description: 'Token JWT ausente ou expirado.' },
          },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Retorna os dados do perfil do usuário logado',
          tags: ['Autenticação'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Dados do usuário (sem senha).',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      role: { type: 'string' },
                      status: { type: 'string' },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Token JWT ausente ou expirado.' },
            '404': { description: 'Usuário não encontrado.' },
          },
        },
      },
      '/auth/profile': {
        put: {
          summary: 'Atualiza nome e/ou email do perfil',
          tags: ['Autenticação'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Novo Nome' },
                    email: { type: 'string', example: 'novo@email.com' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Perfil atualizado com sucesso.' },
            '400': { description: 'Dados inválidos.' },
            '401': { description: 'Token JWT ausente ou expirado.' },
          },
        },
      },
      '/auth/password': {
        put: {
          summary: 'Altera a senha do usuário logado',
          tags: ['Autenticação'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string', example: 'senhaAtual123' },
                    newPassword: { type: 'string', example: 'novaSenha456' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Senha alterada com sucesso.' },
            '400': { description: 'Senha atual incorreta ou dados inválidos.' },
            '401': { description: 'Token JWT ausente ou expirado.' },
          },
        },
      },

      // === TRANSAÇÕES ===
      '/transactions': {
        get: {
          summary: 'Lista todas as transações do usuário',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          parameters: [
            ...paginationParams,
            { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por categoria' },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial (YYYY-MM-DD)' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final (YYYY-MM-DD)' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Buscar por descrição' },
            { name: 'tags', in: 'query', schema: { type: 'string' }, description: 'Filtrar por tags (IDs separados por vírgula)' },
          ],
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
      '/transactions/export/csv': {
        get: {
          summary: 'Exporta transações em CSV',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial (YYYY-MM-DD)' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final (YYYY-MM-DD)' },
          ],
          responses: {
            '200': { description: 'Arquivo CSV exportado (rate limit: 20 requisições a cada 15 min).' },
            '429': { description: 'Muitas requisições. Limite de exportação excedido.' },
          },
        },
      },
      '/transactions/export/pdf': {
        get: {
          summary: 'Exporta transações em PDF',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial (YYYY-MM-DD)' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final (YYYY-MM-DD)' },
          ],
          responses: {
            '200': { description: 'Arquivo PDF exportado (rate limit: 20 requisições a cada 15 min).' },
            '429': { description: 'Muitas requisições. Limite de exportação excedido.' },
          },
        },
      },
      '/transactions/export/template': {
        get: {
          summary: 'Baixa template CSV para importação de transações',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Template CSV baixado.' },
          },
        },
      },
      '/transactions/import/csv': {
        post: {
          summary: 'Importa transações via arquivo CSV',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary', description: 'Arquivo CSV (máx: 5MB)' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Importação concluída com sucesso.' },
            '400': { description: 'Erro no processamento do arquivo.' },
          },
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
          summary: 'Remove uma transação (soft delete)',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Removido com sucesso.' }, '404': { description: 'Inexistente ou sem permissão.' } },
        },
      },
      '/transactions/{id}/tags': {
        post: {
          summary: 'Vincula tags a uma transação',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tagIds'],
                  properties: {
                    tagIds: { type: 'array', items: { type: 'string' }, example: ['tag-id-1', 'tag-id-2'] },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Tags vinculadas à transação.' } },
        },
      },
      '/transactions/{id}/tags/{tagId}': {
        delete: {
          summary: 'Desvincula uma tag de uma transação',
          tags: ['Transações'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'tagId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { '204': { description: 'Tag desvinculada da transação.' } },
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
      '/categories/export/csv': {
        get: {
          summary: 'Exporta categorias em CSV',
          tags: ['Categorias'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Arquivo CSV exportado (rate limit: 20 requisições a cada 15 min).' },
            '429': { description: 'Muitas requisições. Limite de exportação excedido.' },
          },
        },
      },
      '/categories/export/pdf': {
        get: {
          summary: 'Exporta categorias em PDF',
          tags: ['Categorias'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Arquivo PDF exportado (rate limit: 20 requisições a cada 15 min).' },
            '429': { description: 'Muitas requisições. Limite de exportação excedido.' },
          },
        },
      },
      '/categories/import/csv': {
        post: {
          summary: 'Importa categorias via arquivo CSV',
          tags: ['Categorias'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary', description: 'Arquivo CSV (máx: 5MB)' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Importação concluída com sucesso.' },
            '400': { description: 'Erro no processamento do arquivo.' },
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

      // === TAGS ===
      '/tags': {
        post: {
          summary: 'Cria uma nova tag',
          tags: ['Tags'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Urgente' },
                    color: { type: 'string', example: '#FF0000' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Tag criada com sucesso.' } },
        },
        get: {
          summary: 'Lista todas as tags do usuário',
          tags: ['Tags'],
          security: [{ bearerAuth: [] }],
          parameters: paginationParams,
          responses: { '200': { description: 'Lista paginada retornada com sucesso.', content: { 'application/json': { schema: paginationResponse } } } },
        },
      },
      '/tags/{id}': {
        get: {
          summary: 'Detalha uma tag por ID',
          tags: ['Tags'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Sucesso.' }, '404': { description: 'Tag não encontrada.' } },
        },
        put: {
          summary: 'Atualiza uma tag existente',
          tags: ['Tags'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Importante' },
                    color: { type: 'string', example: '#00FF00' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Tag atualizada.' }, '404': { description: 'Tag não encontrada.' } },
        },
        delete: {
          summary: 'Remove uma tag',
          tags: ['Tags'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Tag removida.' }, '404': { description: 'Tag não encontrada.' } },
        },
      },

      // === ORÇAMENTOS (BUDGETS) ===
      '/budgets': {
        post: {
          summary: 'Cria um novo orçamento',
          tags: ['Orçamentos'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'amount', 'startDate', 'endDate'],
                  properties: {
                    name: { type: 'string', example: 'Orçamento Mensal' },
                    amount: { type: 'number', example: 5000.00 },
                    startDate: { type: 'string', format: 'date', example: '2026-01-01' },
                    endDate: { type: 'string', format: 'date', example: '2026-12-31' },
                    categoryId: { type: 'string', example: '751a845c-53a0-40a7-8e65-2b4ff5b36d8d' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Orçamento criado com sucesso.' } },
        },
        get: {
          summary: 'Lista todos os orçamentos do usuário',
          tags: ['Orçamentos'],
          security: [{ bearerAuth: [] }],
          parameters: paginationParams,
          responses: { '200': { description: 'Lista paginada retornada com sucesso.', content: { 'application/json': { schema: paginationResponse } } } },
        },
      },
      '/budgets/{id}': {
        get: {
          summary: 'Detalha um orçamento por ID',
          tags: ['Orçamentos'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Sucesso.' }, '404': { description: 'Orçamento não encontrado.' } },
        },
        put: {
          summary: 'Atualiza um orçamento existente',
          tags: ['Orçamentos'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Orçamento Revisado' },
                    amount: { type: 'number', example: 6000.00 },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    categoryId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Orçamento atualizado.' }, '404': { description: 'Orçamento não encontrado.' } },
        },
        delete: {
          summary: 'Remove um orçamento',
          tags: ['Orçamentos'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Orçamento removido.' }, '404': { description: 'Orçamento não encontrado.' } },
        },
      },

      // === METAS (GOALS) ===
      '/goals': {
        post: {
          summary: 'Cria uma nova meta financeira',
          tags: ['Metas'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'targetAmount', 'deadline'],
                  properties: {
                    name: { type: 'string', example: 'Viagem para Europa' },
                    targetAmount: { type: 'number', example: 15000.00 },
                    currentAmount: { type: 'number', example: 0 },
                    deadline: { type: 'string', format: 'date', example: '2027-06-01' },
                    categoryId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Meta criada com sucesso.' } },
        },
        get: {
          summary: 'Lista todas as metas do usuário',
          tags: ['Metas'],
          security: [{ bearerAuth: [] }],
          parameters: paginationParams,
          responses: { '200': { description: 'Lista paginada retornada com sucesso.', content: { 'application/json': { schema: paginationResponse } } } },
        },
      },
      '/goals/{id}': {
        get: {
          summary: 'Detalha uma meta por ID',
          tags: ['Metas'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Sucesso.' }, '404': { description: 'Meta não encontrada.' } },
        },
        put: {
          summary: 'Atualiza uma meta existente',
          tags: ['Metas'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Viagem Atualizada' },
                    targetAmount: { type: 'number', example: 20000.00 },
                    currentAmount: { type: 'number', example: 5000.00 },
                    deadline: { type: 'string', format: 'date' },
                    categoryId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Meta atualizada.' }, '404': { description: 'Meta não encontrada.' } },
        },
        delete: {
          summary: 'Remove uma meta',
          tags: ['Metas'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Meta removida.' }, '404': { description: 'Meta não encontrada.' } },
        },
      },

      // === REGRAS RECORRENTES ===
      '/recurring': {
        post: {
          summary: 'Cria uma nova regra recorrente',
          tags: ['Regras Recorrentes'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['description', 'amount', 'type', 'frequency', 'interval'],
                  properties: {
                    description: { type: 'string', example: 'Aluguel' },
                    amount: { type: 'number', example: 1200.00 },
                    type: { type: 'string', enum: ['income', 'outcome'], example: 'outcome' },
                    frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'], example: 'monthly' },
                    interval: { type: 'integer', example: 1 },
                    categoryId: { type: 'string' },
                    startsAt: { type: 'string', format: 'date', example: '2026-01-01' },
                    endsAt: { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Regra recorrente criada.' } },
        },
        get: {
          summary: 'Lista todas as regras recorrentes do usuário',
          tags: ['Regras Recorrentes'],
          security: [{ bearerAuth: [] }],
          parameters: paginationParams,
          responses: { '200': { description: 'Lista paginada retornada com sucesso.', content: { 'application/json': { schema: paginationResponse } } } },
        },
      },
      '/recurring/{id}': {
        get: {
          summary: 'Detalha uma regra recorrente por ID',
          tags: ['Regras Recorrentes'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Sucesso.' }, '404': { description: 'Regra não encontrada.' } },
        },
        put: {
          summary: 'Atualiza uma regra recorrente',
          tags: ['Regras Recorrentes'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    amount: { type: 'number' },
                    type: { type: 'string', enum: ['income', 'outcome'] },
                    frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                    interval: { type: 'integer' },
                    categoryId: { type: 'string' },
                    startsAt: { type: 'string', format: 'date' },
                    endsAt: { type: 'string', format: 'date' },
                    active: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Regra atualizada.' }, '404': { description: 'Regra não encontrada.' } },
        },
        delete: {
          summary: 'Remove uma regra recorrente',
          tags: ['Regras Recorrentes'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Regra removida.' }, '404': { description: 'Regra não encontrada.' } },
        },
      },
      '/recurring/{id}/execute': {
        post: {
          summary: 'Executa manualmente uma regra recorrente (gera transação)',
          tags: ['Regras Recorrentes'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '201': { description: 'Transação gerada a partir da regra.' }, '404': { description: 'Regra não encontrada.' } },
        },
      },

      // === ORGANIZAÇÕES ===
      '/organizations': {
        post: {
          summary: 'Cria uma nova organização',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Minha Empresa Ltda' },
                    cnpj: { type: 'string', example: '00.000.000/0001-91' },
                    description: { type: 'string', example: 'Empresa de tecnologia' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Organização criada com sucesso.' } },
        },
        get: {
          summary: 'Lista organizações do usuário',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: paginationParams,
          responses: { '200': { description: 'Lista paginada retornada com sucesso.', content: { 'application/json': { schema: paginationResponse } } } },
        },
      },
      '/organizations/{id}': {
        get: {
          summary: 'Detalha uma organização por ID',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Sucesso.' }, '404': { description: 'Organização não encontrada.' } },
        },
        put: {
          summary: 'Atualiza dados de uma organização',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Nova Razão Social' },
                    cnpj: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Organização atualizada.' }, '404': { description: 'Organização não encontrada.' } },
        },
        delete: {
          summary: 'Remove uma organização',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Organização removida.' }, '404': { description: 'Organização não encontrada.' } },
        },
      },
      '/organizations/select-none': {
        patch: {
          summary: 'Remove o contexto de organização ativo do JWT',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Contexto removido. Novo JWT emitido sem orgId.' } },
        },
      },
      '/organizations/{id}/select': {
        patch: {
          summary: 'Define a organização ativa no contexto (re-emite JWT com orgId)',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Contexto alterado. Novo JWT emitido com orgId.' } },
        },
      },
      '/organizations/{id}/members': {
        get: {
          summary: 'Lista membros de uma organização',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ...paginationParams,
          ],
          responses: { '200': { description: 'Lista de membros retornada.', content: { 'application/json': { schema: paginationResponse } } } },
        },
        post: {
          summary: 'Convida um novo membro para a organização',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'convidado@email.com' },
                    role: { type: 'string', enum: ['admin', 'member', 'viewer'], example: 'member' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Convite enviado com sucesso.' } },
        },
      },
      '/organizations/{id}/members/{memberId}/accept': {
        patch: {
          summary: 'Aceita o convite para entrar na organização',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Convite aceito.' }, '404': { description: 'Convite não encontrado.' } },
        },
      },
      '/organizations/{id}/members/{memberId}/role': {
        put: {
          summary: 'Altera o papel de um membro na organização',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['admin', 'member', 'viewer'], example: 'admin' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Papel atualizado.' } },
        },
      },
      '/organizations/{id}/members/{memberId}': {
        delete: {
          summary: 'Remove um membro da organização',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { '204': { description: 'Membro removido.' } },
        },
      },
      '/organizations/{id}/fiscal-report': {
        get: {
          summary: 'Gera relatório fiscal da organização',
          tags: ['Organizações'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 }, description: 'Ano do relatório fiscal' },
          ],
          responses: { '200': { description: 'Relatório fiscal gerado.' } },
        },
      },

      // === MÉTRICAS E ANALYTICS ===
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
      '/analytics/monthly-series': {
        get: {
          summary: 'Retorna série mensal de receitas e despesas',
          tags: ['Métricas e Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date', example: '2026-01-01' }, description: 'Filtrar a partir desta data (YYYY-MM-DD)' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date', example: '2026-12-31' }, description: 'Filtrar até esta data (YYYY-MM-DD)' },
            { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por categoria específica' },
          ],
          responses: { '200': { description: 'Série mensal calculada.' } },
        },
      },
      '/analytics/comparison': {
        get: {
          summary: 'Compara períodos financeiros (mês atual vs anterior)',
          tags: ['Métricas e Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Início do período base' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Fim do período base' },
          ],
          responses: { '200': { description: 'Comparação gerada.' } },
        },
      },
      '/analytics/top-categories': {
        get: {
          summary: 'Retorna as categorias com maiores gastos',
          tags: ['Métricas e Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date', example: '2026-01-01' }, description: 'Data inicial' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date', example: '2026-12-31' }, description: 'Data final' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 5 }, description: 'Quantidade de categorias (padrão: 5)' },
          ],
          responses: { '200': { description: 'Top categorias calculadas.' } },
        },
      },
      '/analytics/summary': {
        get: {
          summary: 'Resumo executivo financeiro do usuário',
          tags: ['Métricas e Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final' },
          ],
          responses: { '200': { description: 'Resumo executivo gerado.' } },
        },
      },
      '/analytics/cash-flow': {
        get: {
          summary: 'Projeção de fluxo de caixa',
          tags: ['Métricas e Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'months', in: 'query', schema: { type: 'integer', default: 3 }, description: 'Meses à frente para projeção' },
          ],
          responses: { '200': { description: 'Projeção de fluxo de caixa gerada.' } },
        },
      },
      '/analytics/export/csv': {
        get: {
          summary: 'Exporta dados analíticos em CSV',
          tags: ['Métricas e Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final' },
          ],
          responses: {
            '200': { description: 'Arquivo CSV exportado (rate limit: 20 requisições a cada 15 min).' },
            '429': { description: 'Muitas requisições. Limite de exportação excedido.' },
          },
        },
      },
      '/analytics/export/pdf': {
        get: {
          summary: 'Exporta dados analíticos em PDF',
          tags: ['Métricas e Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final' },
          ],
          responses: {
            '200': { description: 'Arquivo PDF exportado (rate limit: 20 requisições a cada 15 min).' },
            '429': { description: 'Muitas requisições. Limite de exportação excedido.' },
          },
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
      '/admin/users/{id}/status': {
        patch: {
          summary: '[Admin] Altera o status de um usuário',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'suspended' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Status atualizado.' }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/users/{id}/role': {
        patch: {
          summary: '[Admin] Altera o papel de um usuário',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['admin', 'user', 'company'], example: 'admin' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Papel atualizado.' }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/users/{id}/plan': {
        patch: {
          summary: '[Admin] Altera o plano de um usuário',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['plan'],
                  properties: {
                    plan: { type: 'string', enum: ['free', 'pro', 'enterprise'], example: 'pro' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Plano atualizado.' }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/categories': {
        get: {
          summary: '[Admin] Lista todas as categorias globais',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: paginationParams,
          responses: { '200': { description: 'Lista paginada de categorias globais.', content: { 'application/json': { schema: paginationResponse } } }, '403': { description: 'Apenas admin.' } },
        },
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
      '/admin/audit-logs': {
        get: {
          summary: '[Admin] Lista logs de auditoria da plataforma',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            ...paginationParams,
            { name: 'userId', in: 'query', schema: { type: 'string' }, description: 'Filtrar por usuário' },
            { name: 'action', in: 'query', schema: { type: 'string' }, description: 'Filtrar por ação' },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final' },
          ],
          responses: { '200': { description: 'Lista paginada de logs de auditoria.', content: { 'application/json': { schema: paginationResponse } } }, '403': { description: 'Apenas admin.' } },
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
      '/admin/analytics/user-growth': {
        get: {
          summary: '[Admin] Crescimento de usuários ao longo do tempo',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final' },
          ],
          responses: { '200': { description: 'Dados de crescimento de usuários.' }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/analytics/performance': {
        get: {
          summary: '[Admin] Métricas de performance do sistema',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Métricas de performance do servidor.' }, '403': { description: 'Apenas admin.' } },
        },
      },
      '/admin/export/users/csv': {
        get: {
          summary: '[Admin] Exporta todos os usuários em CSV',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Arquivo CSV exportado (rate limit: 20 requisições a cada 15 min).' },
            '403': { description: 'Apenas admin.' },
            '429': { description: 'Muitas requisições. Limite de exportação excedido.' },
          },
        },
      },
      '/admin/export/transactions/csv': {
        get: {
          summary: '[Admin] Exporta todas as transações em CSV',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Arquivo CSV exportado (rate limit: 20 requisições a cada 15 min).' },
            '403': { description: 'Apenas admin.' },
            '429': { description: 'Muitas requisições. Limite de exportação excedido.' },
          },
        },
      },
      '/admin/export/audit-logs/csv': {
        get: {
          summary: '[Admin] Exporta logs de auditoria em CSV',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Arquivo CSV exportado (rate limit: 20 requisições a cada 15 min).' },
            '403': { description: 'Apenas admin.' },
            '429': { description: 'Muitas requisições. Limite de exportação excedido.' },
          },
        },
      },
      '/admin/import/transactions/csv': {
        post: {
          summary: '[Admin] Importa transações em lote via CSV',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary', description: 'Arquivo CSV (máx: 5MB)' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Importação concluída.' }, '400': { description: 'Erro no processamento.' }, '403': { description: 'Apenas admin.' } },
        },
      },

      // === HEALTH ===
      '/health': {
        get: {
          summary: 'Verifica o status do servidor e da conexão com o banco de dados',
          tags: ['Health'],
          responses: {
            '200': { description: 'Servidor operacional.' },
            '503': { description: 'Banco de dados indisponível.' },
          },
        },
      },
    },
  };
}
