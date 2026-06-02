# Plano Mestre — Dashboard Financeiro

## Fases (do mais simples ao mais complexo)

### Fase 1 — CSV Export (~2.5 dias)
Exportar dados existentes para CSV.
- `csv.util.ts` — helpers parse/stringify
- Export CSV transações + categorias + analytics (user)
- Export CSV admin (usuários, transações totais, audit logs)
- Export template CSV (download com cabeçalhos + exemplo)

### Fase 2 — PDF Export (~2 dias)
Exportar mesmos dados em PDF com PDFKit.
- `pdf.util.ts` — helpers tabela paginada + gráfico de barras
- Export PDF relatório de transações + analytics (user)
- Export PDF relatório plataforma (admin)

### Fase 3 — CSV Import (~4 dias)
Importar dados via CSV com validação em lote.
- Validators de import (Zod para cada linha)
- Import CSV transações (parse → validar → resolver categoryName → bulkCreate)
- Import CSV categorias
- Import CSV admin (userId no CSV)

### Fase 4 — Tags / Labels (~3.5 dias)
Tags customizáveis N:N para classificar transações.
- Modelo `tags` + tabela pivô `transaction_tags` + migration
- CRUD tags
- Vincular/desvincular tags às transações
- Filtro `?tags=id1,id2` na listagem
- Export/import CSV incluir coluna de tags

### Fase 5 — Orçamentos / Budgets (~3 dias)
Orçamentos mensais por categoria com alerta de estouro.
- Modelo `budgets` (userId, categoryId, month, year, limit) + migration
- CRUD budgets com % gasto calculado
- Alerta `overBudget: boolean`

### Fase 6 — Metas de Economia / Savings Goals (~3.5 dias)
Metas financeiras com progresso percentual.
- Modelo `goals` (name, targetAmount, currentAmount, deadline, categoryId) + migration
- CRUD goals com progresso
- Atualizar currentAmount automaticamente ao criar transação na categoria

### Fase 7 — Relatórios Avançados (~6.5 dias)
Novos endpoints de analytics sem novos modelos.
- `GET /analytics/monthly-series` — série temporal de saldo
- `GET /analytics/comparison` — mês atual vs anterior
- `GET /analytics/top-categories` — top N gastos
- `GET /analytics/summary` — resumo executivo mensal
- `GET /analytics/cash-flow` — projeção com recorrentes
- Export CSV + PDF de todos os analytics

### Fase 8 — Transações Recorrentes (~5 dias)
Agendamento automático com scheduler.
- Modelo `recurring_rules` (frequency, interval, nextDate, active) + migration
- CRUD recurring rules
- Scheduler (gera transações com nextDate <= now)
- `POST /recurring/:id/execute` — gerar manualmente
- Flag `isRecurring: true` na response

### Fase 9 — Dashboard Admin (~3.5 dias)
Melhorias no painel administrativo.
- `GET /admin/audit-logs` paginado com filtros
- `GET /admin/categories` — listar globais
- `GET /admin/analytics/user-growth` — novos users por período
- `GET /admin/analytics/performance` — taxa de erros, requests

### Fase 10 — Diferenciação Company / Multi-usuário (~8 dias)
Isolamento multi-tenant com hierarquia de permissões.
- Modelo `organizations` + `organization_members` + migration
- CRUD membros + convites
- Isolamento de dados (transactions/categories com organizationId)
- Hierarquia de permissões (admin/finance/viewer)
- Relatório fiscal (agrupado por mês, categorias fiscais)

---

## Resumo

| Fase | Nome | Esforço | Complexidade |
|------|------|---------|-------------|
| 1 | CSV Export | 2.5d | ★☆☆☆☆ |
| 2 | PDF Export | 2d | ★☆☆☆☆ |
| 3 | CSV Import | 4d | ★★☆☆☆ |
| 4 | Tags | 3.5d | ★★☆☆☆ |
| 5 | Orçamentos | 3d | ★★☆☆☆ |
| 6 | Metas de Economia | 3.5d | ★★☆☆☆ |
| 7 | Relatórios Avançados | 6.5d | ★★★☆☆ |
| 8 | Transações Recorrentes | 5d | ★★★☆☆ |
| 9 | Dashboard Admin | 3.5d | ★★★☆☆ |
| 10 | Diferenciação Company | 8d | ★★★★★ |

**Total: ~41.5 dias úteis**
