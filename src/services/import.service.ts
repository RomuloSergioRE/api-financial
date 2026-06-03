import { Op } from 'sequelize';
import { z } from 'zod';
import sequelize from '../config/db.js';
import { Transaction, Category, Tag, TransactionTag } from '../models/index.js';
import { parseCSV } from '../utils/csv.util.js';

const importTransactionRowSchema = z.object({
  categoryName: z.string().optional().default(''),
  categoryId: z.string().optional().default(''),
  description: z.string().min(1, 'description is required').max(255).trim(),
  amount: z.string().transform((val, ctx) => {
    const cleaned = val.replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num) || num <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'amount must be a positive number' });
      return z.NEVER;
    }
    return Math.round(num * 100);
  }),
  type: z.enum(['income', 'outcome'], { message: "type must be 'income' or 'outcome'" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  tags: z.string().optional().default(''),
});

const importCategoryRowSchema = z.object({
  name: z.string().min(1, 'name is required').max(255).trim(),
  icon: z.string().optional().default(''),
  color: z.string().optional().default(''),
});

interface ImportResult {
  imported: number;
  errors: Array<{ line: number; field: string; message: string }>;
}

async function resolveCategoryId(
  userId: string,
  categoryName: string,
  categoryId: string
): Promise<string | null> {
  if (categoryId) return categoryId;
  if (!categoryName) return null;

  const category = await Category.findOne({
    where: {
      name: categoryName.trim(),
      [Op.or]: [{ userId }, { userId: null }],
    },
  });
  return category?.id ?? null;
}

async function resolveTagIds(userId: string, tagsStr: string): Promise<string[]> {
  if (!tagsStr.trim()) return [];
  const names = tagsStr.split(',').map(n => n.trim()).filter(Boolean);
  if (names.length === 0) return [];

  const tags = await Tag.findAll({
    where: { name: { [Op.in]: names }, userId },
  });
  return tags.map(t => t.id);
}

export const ImportService = {
  async importTransactions(userId: string, buffer: Buffer, orgId?: string): Promise<ImportResult> {
    const lines = parseCSV(buffer);
    const errors: ImportResult['errors'] = [];
    const validRows: Array<{
      data: {
        userId: string;
        categoryId: string;
        description: string;
        amount: number;
        type: 'income' | 'outcome';
        date: Date;
        organizationId?: string | null;
      };
      tagIds: string[];
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as Record<string, string>;
      const lineNum = i + 2;

      const parsed = importTransactionRowSchema.safeParse(line);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({ line: lineNum, field: issue.path.join('.'), message: issue.message });
        }
        continue;
      }

      const categoryId = await resolveCategoryId(
        userId,
        parsed.data.categoryName,
        parsed.data.categoryId
      );
      if (!categoryId) {
        const nameField = parsed.data.categoryName || parsed.data.categoryId;
        errors.push({
          line: lineNum,
          field: 'category',
          message: `Category not found: "${nameField}"`,
        });
        continue;
      }

      const tagIds = await resolveTagIds(userId, parsed.data.tags);

      validRows.push({
        data: {
          userId,
          categoryId,
          description: parsed.data.description,
          amount: parsed.data.amount,
          type: parsed.data.type,
          date: new Date(parsed.data.date),
          organizationId: orgId || null,
        },
        tagIds,
      });
    }

    if (validRows.length > 0) {
      await sequelize.transaction(async (t) => {
        const created = await Transaction.bulkCreate(validRows.map(r => r.data), { returning: true, transaction: t });

        const tagLinks: Array<{ transactionId: string; tagId: string }> = [];
        for (let j = 0; j < created.length; j++) {
          const row = validRows[j]!;
          const transactionId = created[j]!.id;
          for (const tagId of row.tagIds) {
            tagLinks.push({ transactionId, tagId });
          }
        }

        if (tagLinks.length > 0) {
          await TransactionTag.bulkCreate(tagLinks, { transaction: t });
        }
      });
    }

    return { imported: validRows.length, errors };
  },

  async importCategories(userId: string, buffer: Buffer, orgId?: string): Promise<ImportResult> {
    const lines = parseCSV(buffer);
    const errors: ImportResult['errors'] = [];
    const validCategories: Array<{
      name: string;
      icon: string | null;
      color: string | null;
      userId: string;
      organizationId?: string | null;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as Record<string, string>;
      const lineNum = i + 2;

      const parsed = importCategoryRowSchema.safeParse(line);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({ line: lineNum, field: issue.path.join('.'), message: issue.message });
        }
        continue;
      }

      const existing = await Category.findOne({
        where: {
          name: parsed.data.name,
          [Op.or]: [{ userId }, { userId: null }],
        },
      });
      if (existing) {
        errors.push({ line: lineNum, field: 'name', message: `Category already exists: "${parsed.data.name}"` });
        continue;
      }

      validCategories.push({
        name: parsed.data.name,
        icon: parsed.data.icon || null,
        color: parsed.data.color || null,
        userId,
        organizationId: orgId || null,
      });
    }

    if (validCategories.length > 0) {
      await sequelize.transaction(async (t) => {
        await Category.bulkCreate(validCategories, { transaction: t });
      });
    }

    return { imported: validCategories.length, errors };
  },

  async importTransactionsAdmin(adminId: string, buffer: Buffer): Promise<ImportResult> {
    const lines = parseCSV(buffer);
    const errors: ImportResult['errors'] = [];
    const validRows: Array<{
      data: {
        userId: string;
        categoryId: string;
        description: string;
        amount: number;
        type: 'income' | 'outcome';
        date: Date;
      };
      tagIds: string[];
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as Record<string, string>;
      const lineNum = i + 2;

      const rowSchema = importTransactionRowSchema.extend({
        userId: z.string().uuid('userId must be a valid UUID'),
      });
      const parsed = rowSchema.safeParse(line);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({ line: lineNum, field: issue.path.join('.'), message: issue.message });
        }
        continue;
      }

      const categoryId = await resolveCategoryId(
        parsed.data.userId,
        parsed.data.categoryName,
        parsed.data.categoryId
      );
      if (!categoryId) {
        const nameField = parsed.data.categoryName || parsed.data.categoryId;
        errors.push({
          line: lineNum,
          field: 'category',
          message: `Category not found: "${nameField}"`,
        });
        continue;
      }

      const tagIds = await resolveTagIds(parsed.data.userId, parsed.data.tags);

      validRows.push({
        data: {
          userId: parsed.data.userId,
          categoryId,
          description: parsed.data.description,
          amount: parsed.data.amount,
          type: parsed.data.type,
          date: new Date(parsed.data.date),
        },
        tagIds,
      });
    }

    if (validRows.length > 0) {
      await sequelize.transaction(async (t) => {
        const created = await Transaction.bulkCreate(validRows.map(r => r.data), { returning: true, transaction: t });

        const tagLinks: Array<{ transactionId: string; tagId: string }> = [];
        for (let j = 0; j < created.length; j++) {
          const row = validRows[j]!;
          const transactionId = created[j]!.id;
          for (const tagId of row.tagIds) {
            tagLinks.push({ transactionId, tagId });
          }
        }

        if (tagLinks.length > 0) {
          await TransactionTag.bulkCreate(tagLinks, { transaction: t });
        }
      });
    }

    return { imported: validRows.length, errors };
  },
};
