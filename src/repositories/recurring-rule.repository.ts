import { Op } from 'sequelize';
import RecurringRule from '../models/recurring-rule.model.js';
import type { RecurringRuleInterface, RecurringRuleCreateInput, RecurringRuleUpdateInput } from '../types/recurring-rule.types.js';
import type { OrgContext } from '../types/organization.types.js';

export const RecurringRuleRepository = {
  create: async (userId: string, data: RecurringRuleCreateInput, orgId?: string | null): Promise<RecurringRuleInterface> => {
    const rule = await RecurringRule.create({ ...data, userId, organizationId: orgId || null });
    return rule.dataValues as RecurringRuleInterface;
  },

  findByUser: async (userId: string, active?: boolean, orgContext?: OrgContext): Promise<RecurringRuleInterface[]> => {
    const where: Record<string, unknown> = {};

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
      where.organizationId = null;
    }

    if (active !== undefined) where.active = active;
    const rules = await RecurringRule.findAll({ where, order: [['nextDate', 'ASC']] });
    return rules.map(r => r.dataValues as RecurringRuleInterface);
  },

  findByIdAndUser: async (id: string, userId: string, orgContext?: OrgContext): Promise<RecurringRuleInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const rule = await RecurringRule.findOne({ where });
    return rule ? (rule.dataValues as RecurringRuleInterface) : null;
  },

  update: async (id: string, userId: string, data: RecurringRuleUpdateInput, orgContext?: OrgContext): Promise<RecurringRuleInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const [affectedCount, affectedRows] = await RecurringRule.update(data, {
      where,
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as RecurringRuleInterface;
  },

  delete: async (id: string, userId: string, orgContext?: OrgContext): Promise<boolean> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const deleted = await RecurringRule.destroy({ where });
    return deleted > 0;
  },

  findDueRules: async (): Promise<RecurringRuleInterface[]> => {
    const today = new Date().toISOString().split('T')[0];
    const rules = await RecurringRule.findAll({
      where: {
        active: true,
        nextDate: { [Op.lte]: today },
      },
      order: [['nextDate', 'ASC']],
    });
    return rules.map(r => r.dataValues as RecurringRuleInterface);
  },

  updateNextDate: async (id: string, nextDate: string): Promise<void> => {
    await RecurringRule.update({ nextDate }, { where: { id } });
  },

  deactivate: async (id: string): Promise<void> => {
    await RecurringRule.update({ active: false }, { where: { id } });
  },
};
