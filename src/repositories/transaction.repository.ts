import { Op } from 'sequelize';
import { Transaction, Category, Tag } from '../models/index.js';
import type { TransactionInterface, TransactionCreateInput, TransactionUpdateInput } from '../types/transaction.types.js';
import type { TagDTO } from '../types/tag.types.js';

interface OrgContext {
  memberIds: string[];
  orgId: string;
}

export const TransactionRepository = {
  create: async (userId: string, data: TransactionCreateInput, orgId?: string | null): Promise<TransactionInterface> => {
    const transaction = await Transaction.create({ ...data, userId, organizationId: orgId || null });
    return transaction.dataValues as TransactionInterface;
  },

  findByUser: async (
    userId: string,
    pagination?: { offset: number; limit: number },
    categoryId?: string,
    startDate?: string,
    endDate?: string,
    search?: string,
    tagIds?: string[],
    orgContext?: OrgContext
  ): Promise<{ rows: TransactionInterface[]; total: number }> => {
    const where: Record<string, unknown> = {};

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
      where.organizationId = null;
    }

    if (categoryId) where.categoryId = categoryId;
    if (startDate && endDate) {
      where.date = { [Op.gte]: new Date(startDate), [Op.lte]: new Date(endDate) };
    }
    if (startDate && !endDate) {
      where.date = { [Op.gte]: new Date(startDate) };
    }
    if (!startDate && endDate) {
      where.date = { [Op.lte]: new Date(endDate) };
    }
    if (search) {
      where.description = { [Op.iLike]: `%${search}%` };
    }

    const include: Array<{ model: typeof Category; as: string; attributes: string[] } | { model: typeof Tag; as: string; through: { attributes: string[] }; required?: boolean; where?: Record<string, unknown> }> = [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color'],
      },
    ];

    if (tagIds && tagIds.length > 0) {
      include.push({
        model: Tag,
        as: 'tags',
        through: { attributes: [] },
        required: true,
        where: { id: { [Op.in]: tagIds } },
      });
    } else {
      include.push({
        model: Tag,
        as: 'tags',
        through: { attributes: [] },
        required: false,
      });
    }

    const { rows, count } = await Transaction.findAndCountAll({
      where,
      include,
      order: [['date', 'DESC']],
      offset: pagination?.offset ?? 0,
      limit: pagination?.limit ?? 20,
      distinct: true,
    });

    const mapped = rows.map(t => {
      const data = t.dataValues as TransactionInterface;
      if (data.tags) {
        (data as unknown as Record<string, unknown>).tags = (data.tags as unknown as Array<Record<string, unknown>>).map(
          (tag: Record<string, unknown>) => {
            const { TransactionTag, ...rest } = tag;
            return rest as TagDTO;
          }
        );
      }
      return data;
    });

    return { rows: mapped, total: count };
  },

  findByIdAndUser: async (id: string, userId: string, orgContext?: OrgContext): Promise<TransactionInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const transaction = await Transaction.findOne({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color'],
        },
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] },
        },
      ],
    });
    if (!transaction) return null;

    const data = transaction.dataValues as TransactionInterface;
    if (data.tags) {
      (data as unknown as Record<string, unknown>).tags = (data.tags as unknown as Array<Record<string, unknown>>).map(
        (tag: Record<string, unknown>) => {
          const { TransactionTag, ...rest } = tag;
          return rest as TagDTO;
        }
      );
    }
    return data;
  },

  update: async (id: string, userId: string, data: TransactionUpdateInput, orgContext?: OrgContext): Promise<TransactionInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const [affectedCount, affectedRows] = await Transaction.update(data, {
      where,
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as TransactionInterface;
  },

  delete: async (id: string, userId: string, orgContext?: OrgContext): Promise<boolean> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const deletedRows = await Transaction.destroy({ where });
    return deletedRows > 0;
  },
};
