import { Op, fn, col } from 'sequelize';
import { Transaction, Category, User, AuditLog, Tag, TransactionTag } from '../models/index.js';
import type {
  TransactionExportRow,
  CategoryExportRow,
  AnalyticsExportRow,
  UserExportRow,
  AuditLogExportRow,
  TransactionTemplateRow,
} from '../types/export.types.js';
import { stringifyCSV, type CsvRow, type StringifyColumns } from '../utils/csv.util.js';
import {
  buildPdf,
  formatCurrencyCents,
  formatDate as formatDateUtil,
  formatDateTime,
  addPdfHeader,
  renderTable,
  type PdfResult,
  type TableColumn,
} from '../utils/pdf.util.js';

export interface TransactionExportFilters {
  startDate?: string | undefined;
  endDate?: string | undefined;
  categoryId?: string | undefined;
  search?: string | undefined;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

function toDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return (d.toISOString().split('T')[0] ?? '');
}

function buildDateRange(filters: TransactionExportFilters): Record<symbol, Date> | undefined {
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(filters.endDate);
    end.setUTCHours(23, 59, 59, 999);
    return { [Op.gte]: start, [Op.lte]: end };
  }
  if (filters.startDate) {
    const start = new Date(filters.startDate);
    start.setUTCHours(0, 0, 0, 0);
    return { [Op.gte]: start };
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setUTCHours(23, 59, 59, 999);
    return { [Op.lte]: end };
  }
  return undefined;
}

async function fetchTagsForTransactions(transactionIds: string[]): Promise<Map<string, string>> {
  if (transactionIds.length === 0) return new Map();
  const links = await TransactionTag.findAll({
    where: { transactionId: { [Op.in]: transactionIds } },
    include: [{ model: Tag, as: 'tag', attributes: ['name'] }],
  });
  const tagMap = new Map<string, string[]>();
  for (const link of links) {
    const tid = link.transactionId;
    const name = (link as unknown as { tag?: { name: string } }).tag?.name;
    if (name) {
      const existing = tagMap.get(tid) ?? [];
      existing.push(name);
      tagMap.set(tid, existing);
    }
  }
  const result = new Map<string, string>();
  for (const [tid, names] of tagMap) {
    result.set(tid, names.join(', '));
  }
  return result;
}

export const ExportService = {
  async exportTransactionsCSV(
    userId: string,
    filters: TransactionExportFilters = {},
    orgId?: string
  ): Promise<{ content: string; filename: string }> {
    const where: Record<string, unknown> = {};

    if (orgId) {
      where.organizationId = orgId;
    } else {
      where.userId = userId;
      where.organizationId = null;
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.search) where.description = { [Op.iLike]: `%${filters.search}%` };
    const dateRange = buildDateRange(filters);
    if (dateRange) where.date = dateRange;

    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: [['date', 'DESC']],
      raw: true,
      nest: true,
    });

    const transactionIds = (transactions as unknown as Array<{ id: string }>).map(t => t.id);
    const tagMap = await fetchTagsForTransactions(transactionIds);

    const rows: CsvRow[] = (transactions as unknown as Array<{
      id: string;
      date: Date;
      type: string;
      amount: number;
      categoryId: string;
      description: string;
      category?: { id: string; name: string };
    }>).map(t => ({
      id: t.id,
      date: toDateOnly(t.date),
      type: t.type,
      amount: t.amount.toString(),
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? '',
      description: t.description,
      tags: tagMap.get(t.id) ?? '',
    }));

    const columns: StringifyColumns = [
      { key: 'id', header: 'ID' },
      { key: 'date', header: 'Date' },
      { key: 'type', header: 'Type' },
      { key: 'amount', header: 'Amount (cents)' },
      { key: 'categoryId', header: 'Category ID' },
      { key: 'categoryName', header: 'Category Name' },
      { key: 'description', header: 'Description' },
      { key: 'tags', header: 'Tags' },
    ];

    const content = stringifyCSV(rows, columns);
    const filename = `transactions-${toDateOnly(new Date())}.csv`;

    return { content, filename };
  },

  async exportCategoriesCSV(
    userId: string,
    orgId?: string
  ): Promise<{ content: string; filename: string }> {
    const orConditions: Array<Record<string, unknown>> = [];
    if (orgId) {
      orConditions.push({ organizationId: orgId });
      orConditions.push({ userId: null });
    } else {
      orConditions.push({ userId });
      orConditions.push({ userId: null });
    }
    const where: Record<string, unknown> = { [Op.or]: orConditions };
    if (!orgId) where.organizationId = null;
    const categories = await Category.findAll({ where,
      order: [['name', 'ASC']],
    });

    const rows: CsvRow[] = (categories as unknown as Array<{
      id: string;
      name: string;
      icon: string | null;
      color: string | null;
      userId: string | null;
    }>).map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon ?? '',
      color: c.color ?? '',
      type: c.userId === null ? 'global' : 'user',
    }));

    const columns: StringifyColumns = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'icon', header: 'Icon' },
      { key: 'color', header: 'Color' },
      { key: 'type', header: 'Type' },
    ];

    const content = stringifyCSV(rows, columns);
    const filename = `categories-${toDateOnly(new Date())}.csv`;

    return { content, filename };
  },

  async exportAnalyticsCSV(
    userId: string,
    filters: TransactionExportFilters = {}
  ): Promise<{ content: string; filename: string }> {
    const where: Record<string, unknown> = { userId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    const dateRange = buildDateRange(filters);
    if (dateRange) where.date = dateRange;

    const aggregates = await Transaction.findAll({
      where,
      attributes: [
        'type',
        [fn('SUM', col('amount')), 'total'],
      ],
      group: ['type'],
      raw: true,
    });

    const aggRows = aggregates as unknown as Array<{ type: string; total: string }>;
    const totalIncome = Number(aggRows.find(r => r.type === 'income')?.total || 0);
    const totalOutcome = Number(aggRows.find(r => r.type === 'outcome')?.total || 0);
    const netBalance = totalIncome - totalOutcome;

    const categoryGroups = await Transaction.findAll({
      where,
      attributes: [
        'categoryId',
        [fn('SUM', col('amount')), 'total'],
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name'],
          required: false,
        },
      ],
      group: ['Transaction.categoryId', 'category.id'],
      raw: true,
      nest: true,
    });

    const categoryRows = categoryGroups as unknown as Array<{
      categoryId: string;
      total: string;
      category?: { name: string };
    }>;
    const totalPeriod = categoryRows.reduce((sum, r) => sum + Number(r.total), 0);

    const monthlySeries = await Transaction.findAll({
      where,
      attributes: [
        [fn('to_char', col('date'), 'YYYY-MM'), 'month'],
        'type',
        [fn('SUM', col('amount')), 'total'],
      ],
      group: [fn('to_char', col('date'), 'YYYY-MM'), 'type'],
      order: [[fn('to_char', col('date'), 'YYYY-MM'), 'ASC']],
      raw: true,
    });

    const seriesMap = new Map<string, { income: number; outcome: number }>();
    for (const row of monthlySeries as unknown as Array<{ month: string; type: string; total: string }>) {
      const prev = seriesMap.get(row.month) ?? { income: 0, outcome: 0 };
      if (row.type === 'income') prev.income += Number(row.total);
      else if (row.type === 'outcome') prev.outcome += Number(row.total);
      seriesMap.set(row.month, prev);
    }

    const topCategoryRows = categoryRows
      .sort((a, b) => Number(b.total) - Number(a.total))
      .slice(0, 5);

    const rows: CsvRow[] = [
      { section: 'Summary', item: 'Total Income', amount: totalIncome.toString(), percentage: '', period: '' },
      { section: 'Summary', item: 'Total Outcome', amount: totalOutcome.toString(), percentage: '', period: '' },
      { section: 'Summary', item: 'Net Balance', amount: netBalance.toString(), percentage: '', period: '' },
      { section: '', item: '', amount: '', percentage: '', period: '' },
      { section: 'Category Breakdown', item: 'Name', amount: 'Amount', percentage: 'Share', period: '' },
      ...categoryRows.map(r => ({
        section: '',
        item: r.category?.name ?? 'Uncategorized',
        amount: Number(r.total).toString(),
        percentage: totalPeriod > 0 ? ((Number(r.total) / totalPeriod) * 100).toFixed(2) : '0',
        period: '',
      })),
      { section: '', item: '', amount: '', percentage: '', period: '' },
      { section: 'Monthly Series', item: 'Month', amount: 'Income', percentage: 'Outcome', period: 'Net' },
      ...Array.from(seriesMap.entries()).map(([month, vals]) => ({
        section: '',
        item: month,
        amount: vals.income.toString(),
        percentage: vals.outcome.toString(),
        period: (vals.income - vals.outcome).toString(),
      })),
      { section: '', item: '', amount: '', percentage: '', period: '' },
      { section: 'Top Categories', item: 'Name', amount: 'Amount', percentage: 'Share', period: '' },
      ...topCategoryRows.map(r => ({
        section: '',
        item: r.category?.name ?? 'Uncategorized',
        amount: Number(r.total).toString(),
        percentage: totalPeriod > 0 ? ((Number(r.total) / totalPeriod) * 100).toFixed(2) : '0',
        period: '',
      })),
    ];

    const columns: StringifyColumns = [
      { key: 'section', header: 'Section' },
      { key: 'item', header: 'Item' },
      { key: 'amount', header: 'Amount (cents)' },
      { key: 'percentage', header: 'Percentage' },
      { key: 'period', header: 'Period' },
    ];

    const content = stringifyCSV(rows, columns);
    const filename = `analytics-${toDateOnly(new Date())}.csv`;

    return { content, filename };
  },

  async exportUsersCSV(): Promise<{ content: string; filename: string }> {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });

    const rows: CsvRow[] = (users as unknown as Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      createdAt: Date;
    }>).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: formatDate(u.createdAt),
    }));

    const columns: StringifyColumns = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role' },
      { key: 'status', header: 'Status' },
      { key: 'createdAt', header: 'Created At' },
    ];

    const content = stringifyCSV(rows, columns);
    const filename = `users-${toDateOnly(new Date())}.csv`;

    return { content, filename };
  },

  async exportAllTransactionsCSV(
    filters: { userId?: string | undefined; startDate?: string | undefined; endDate?: string | undefined } = {}
  ): Promise<{ content: string; filename: string }> {
    const where: Record<string, unknown> = {};
    if (filters.userId) where.userId = filters.userId;
    const dateRange = buildDateRange(filters);
    if (dateRange) where.date = dateRange;

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC']],
      raw: true,
      nest: true,
    });

    const transactionIds = (transactions as unknown as Array<{ id: string }>).map(t => t.id);
    const tagMap = await fetchTagsForTransactions(transactionIds);

    const rows: CsvRow[] = (transactions as unknown as Array<{
      id: string;
      date: Date;
      type: string;
      amount: number;
      description: string;
      userId: string;
      user?: { name: string; email: string };
      categoryId: string;
      category?: { name: string };
    }>).map(t => ({
      id: t.id,
      userId: t.userId,
      userName: t.user?.name ?? '',
      userEmail: t.user?.email ?? '',
      date: toDateOnly(t.date),
      type: t.type,
      amount: t.amount.toString(),
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? '',
      description: t.description,
      tags: tagMap.get(t.id) ?? '',
    }));

    const columns: StringifyColumns = [
      { key: 'id', header: 'ID' },
      { key: 'userId', header: 'User ID' },
      { key: 'userName', header: 'User Name' },
      { key: 'userEmail', header: 'User Email' },
      { key: 'date', header: 'Date' },
      { key: 'type', header: 'Type' },
      { key: 'amount', header: 'Amount (cents)' },
      { key: 'categoryId', header: 'Category ID' },
      { key: 'categoryName', header: 'Category Name' },
      { key: 'description', header: 'Description' },
      { key: 'tags', header: 'Tags' },
    ];

    const content = stringifyCSV(rows, columns);
    const filename = `all-transactions-${toDateOnly(new Date())}.csv`;

    return { content, filename };
  },

  async exportAuditLogsCSV(): Promise<{ content: string; filename: string }> {
    const logs = await AuditLog.findAll({ order: [['createdAt', 'DESC']] });

    const rows: CsvRow[] = (logs as unknown as Array<{
      id: string;
      adminId: string;
      action: string;
      targetId: string;
      targetType: string;
      details: string | null;
      createdAt: Date;
    }>).map(l => ({
      id: l.id,
      adminId: l.adminId,
      action: l.action,
      targetId: l.targetId,
      targetType: l.targetType,
      details: l.details ?? '',
      createdAt: formatDate(l.createdAt),
    }));

    const columns: StringifyColumns = [
      { key: 'id', header: 'ID' },
      { key: 'adminId', header: 'Admin ID' },
      { key: 'action', header: 'Action' },
      { key: 'targetId', header: 'Target ID' },
      { key: 'targetType', header: 'Target Type' },
      { key: 'details', header: 'Details' },
      { key: 'createdAt', header: 'Created At' },
    ];

    const content = stringifyCSV(rows, columns);
    const filename = `audit-logs-${toDateOnly(new Date())}.csv`;

    return { content, filename };
  },

  getTransactionCSVTemplate(): { content: string; filename: string } {
    const template: TransactionTemplateRow = {
      categoryName: 'Alimentação',
      categoryId: '',
      description: 'Supermercado do mês',
      amount: 15000,
      type: 'outcome',
      date: '2026-06-01',
    };

    const rows: CsvRow[] = [{
      categoryName: template.categoryName,
      categoryId: template.categoryId,
      description: template.description,
      amount: template.amount.toString(),
      type: template.type,
      date: template.date,
      tags: 'supermercado, essencial',
    }];

    const columns: StringifyColumns = [
      { key: 'categoryName', header: 'Category Name' },
      { key: 'categoryId', header: 'Category ID' },
      { key: 'description', header: 'Description' },
      { key: 'amount', header: 'Amount (cents)' },
      { key: 'type', header: 'Type' },
      { key: 'date', header: 'Date (YYYY-MM-DD)' },
      { key: 'tags', header: 'Tags' },
    ];

    const content = stringifyCSV(rows, columns);
    const filename = 'transactions-template.csv';

    return { content, filename };
  },

  async exportTransactionsPDF(
    userId: string,
    filters: TransactionExportFilters = {},
    orgId?: string
  ): Promise<PdfResult> {
    const where: Record<string, unknown> = {};

    if (orgId) {
      where.organizationId = orgId;
    } else {
      where.userId = userId;
      where.organizationId = null;
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.search) where.description = { [Op.iLike]: `%${filters.search}%` };
    const dateRange = buildDateRange(filters);
    if (dateRange) where.date = dateRange;

    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: [['date', 'DESC']],
      raw: true,
      nest: true,
    });

    const transactionIds = (transactions as unknown as Array<{ id: string }>).map(t => t.id);
    const tagMap = await fetchTagsForTransactions(transactionIds);

    const rows = (transactions as unknown as Array<{
      id: string;
      date: Date;
      type: string;
      amount: number;
      category?: { name: string };
      description: string;
    }>).map(t => ({
      date: formatDateUtil(t.date),
      type: t.type === 'income' ? 'Income' : 'Outcome',
      amount: formatCurrencyCents(Number(t.amount)),
      category: t.category?.name ?? 'Uncategorized',
      description: t.description,
      tags: tagMap.get(t.id) ?? '',
    }));

    const totalIncome = (transactions as unknown as Array<{ type: string; amount: number }>)
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalOutcome = (transactions as unknown as Array<{ type: string; amount: number }>)
      .filter(t => t.type === 'outcome')
      .reduce((s, t) => s + Number(t.amount), 0);

    const columns: TableColumn[] = [
      { key: 'date', header: 'Date', width: 70 },
      { key: 'type', header: 'Type', width: 50, align: 'center' },
      { key: 'category', header: 'Category', width: 90 },
      { key: 'tags', header: 'Tags', width: 90 },
      { key: 'description', header: 'Description', width: 140 },
      { key: 'amount', header: 'Amount', width: 80, align: 'right' },
    ];

    return buildPdf(doc => {
      addPdfHeader(doc, {
        title: 'Transactions Report',
        subtitle: `Generated at ${formatDateTime(new Date())} · ${rows.length} record(s)`,
      });
      renderTable(doc, columns, rows);
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827');
      doc.text(`Total Income:  ${formatCurrencyCents(totalIncome)}`);
      doc.text(`Total Outcome: ${formatCurrencyCents(totalOutcome)}`);
      doc.text(`Net Balance:   ${formatCurrencyCents(totalIncome - totalOutcome)}`);
    }, `transactions-${formatDateUtil(new Date())}.pdf`);
  },

  async exportCategoriesPDF(userId: string, orgId?: string): Promise<PdfResult> {
    const orConditions: Array<Record<string, unknown>> = [];
    if (orgId) {
      orConditions.push({ organizationId: orgId });
      orConditions.push({ userId: null });
    } else {
      orConditions.push({ userId });
      orConditions.push({ userId: null });
    }
    const where: Record<string, unknown> = { [Op.or]: orConditions };
    if (!orgId) where.organizationId = null;
    const categories = await Category.findAll({ where,
      order: [['name', 'ASC']],
    });

    const rows = (categories as unknown as Array<{
      name: string;
      icon: string | null;
      color: string | null;
      userId: string | null;
    }>).map(c => ({
      name: c.name,
      type: c.userId === null ? 'Global' : 'User',
      icon: c.icon ?? '-',
      color: c.color ?? '-',
    }));

    const columns: TableColumn[] = [
      { key: 'name', header: 'Name', width: 150 },
      { key: 'type', header: 'Type', width: 80, align: 'center' },
      { key: 'icon', header: 'Icon', width: 80, align: 'center' },
      { key: 'color', header: 'Color', width: 100, align: 'center' },
    ];

    return buildPdf(doc => {
      addPdfHeader(doc, {
        title: 'Categories Report',
        subtitle: `Generated at ${formatDateTime(new Date())} · ${rows.length} categor(ies)`,
      });
      renderTable(doc, columns, rows);
    }, `categories-${formatDateUtil(new Date())}.pdf`);
  },

  async exportAnalyticsPDF(
    userId: string,
    filters: TransactionExportFilters = {}
  ): Promise<PdfResult> {
    const where: Record<string, unknown> = { userId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    const dateRange = buildDateRange(filters);
    if (dateRange) where.date = dateRange;

    const aggregates = await Transaction.findAll({
      where,
      attributes: ['type', [fn('SUM', col('amount')), 'total']],
      group: ['type'],
      raw: true,
    });
    const aggRows = aggregates as unknown as Array<{ type: string; total: string }>;
    const totalIncome = Number(aggRows.find(r => r.type === 'income')?.total || 0);
    const totalOutcome = Number(aggRows.find(r => r.type === 'outcome')?.total || 0);
    const netBalance = totalIncome - totalOutcome;

    const categoryGroups = await Transaction.findAll({
      where,
      attributes: ['categoryId', [fn('SUM', col('amount')), 'total']],
      include: [
        { model: Category, as: 'category', attributes: ['name'], required: false },
      ],
      group: ['Transaction.categoryId', 'category.id'],
      raw: true,
      nest: true,
    });
    const categoryRows = (categoryGroups as unknown as Array<{
      categoryId: string;
      total: string;
      category?: { name: string };
    }>).map(r => ({
      category: r.category?.name ?? 'Uncategorized',
      amount: Number(r.total),
    }));
    const totalPeriod = categoryRows.reduce((s, r) => s + r.amount, 0);

    const topCategoryRows = [...categoryRows].sort((a, b) => b.amount - a.amount).slice(0, 5);

    const monthlySeries = await Transaction.findAll({
      where,
      attributes: [
        [fn('to_char', col('date'), 'YYYY-MM'), 'month'],
        'type',
        [fn('SUM', col('amount')), 'total'],
      ],
      group: [fn('to_char', col('date'), 'YYYY-MM'), 'type'],
      order: [[fn('to_char', col('date'), 'YYYY-MM'), 'ASC']],
      raw: true,
    });

    const seriesMap = new Map<string, { income: number; outcome: number }>();
    for (const row of monthlySeries as unknown as Array<{ month: string; type: string; total: string }>) {
      const prev = seriesMap.get(row.month) ?? { income: 0, outcome: 0 };
      if (row.type === 'income') prev.income += Number(row.total);
      else if (row.type === 'outcome') prev.outcome += Number(row.total);
      seriesMap.set(row.month, prev);
    }

    const summaryColumns: TableColumn[] = [
      { key: 'item', header: 'Item', width: 200 },
      { key: 'amount', header: 'Amount', width: 120, align: 'right' },
    ];
    const summaryRows = [
      { item: 'Total Income', amount: formatCurrencyCents(totalIncome) },
      { item: 'Total Outcome', amount: formatCurrencyCents(totalOutcome) },
      { item: 'Net Balance', amount: formatCurrencyCents(netBalance) },
    ];

    const breakdownColumns: TableColumn[] = [
      { key: 'category', header: 'Category', width: 200 },
      { key: 'amount', header: 'Amount', width: 100, align: 'right' },
      { key: 'percentage', header: 'Share', width: 70, align: 'right' },
    ];
    const breakdownRows = categoryRows.map(r => ({
      category: r.category,
      amount: formatCurrencyCents(r.amount),
      percentage: totalPeriod > 0 ? `${((r.amount / totalPeriod) * 100).toFixed(2)}%` : '0%',
    }));

    const seriesColumns: TableColumn[] = [
      { key: 'month', header: 'Month', width: 90 },
      { key: 'income', header: 'Income', width: 100, align: 'right' },
      { key: 'outcome', header: 'Outcome', width: 100, align: 'right' },
      { key: 'net', header: 'Net', width: 100, align: 'right' },
    ];
    const seriesRows = Array.from(seriesMap.entries()).map(([month, vals]) => ({
      month,
      income: formatCurrencyCents(vals.income),
      outcome: formatCurrencyCents(vals.outcome),
      net: formatCurrencyCents(vals.income - vals.outcome),
    }));

    const topColumns: TableColumn[] = [
      { key: 'category', header: 'Category', width: 200 },
      { key: 'amount', header: 'Amount', width: 100, align: 'right' },
      { key: 'percentage', header: 'Share', width: 70, align: 'right' },
    ];
    const topRows = topCategoryRows.map(r => ({
      category: r.category,
      amount: formatCurrencyCents(r.amount),
      percentage: totalPeriod > 0 ? `${((r.amount / totalPeriod) * 100).toFixed(2)}%` : '0%',
    }));

    return buildPdf(doc => {
      addPdfHeader(doc, {
        title: 'Analytics Report',
        subtitle: `Generated at ${formatDateTime(new Date())}`,
      });
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Summary');
      doc.moveDown(0.3);
      renderTable(doc, summaryColumns, summaryRows);
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Category Breakdown');
      doc.moveDown(0.3);
      renderTable(doc, breakdownColumns, breakdownRows);
      if (seriesRows.length > 0) {
        doc.addPage();
        addPdfHeader(doc, { title: 'Monthly Series', subtitle: '' });
        doc.moveDown(0.3);
        renderTable(doc, seriesColumns, seriesRows);
      }
      if (topRows.length > 0) {
        doc.addPage();
        addPdfHeader(doc, { title: 'Top Categories', subtitle: '' });
        doc.moveDown(0.3);
        renderTable(doc, topColumns, topRows);
      }
    }, `analytics-${formatDateUtil(new Date())}.pdf`);
  },
};
