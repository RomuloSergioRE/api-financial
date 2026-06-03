import { RecurringRuleRepository } from '../repositories/recurring-rule.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { BudgetService } from './budget.service.js';
import { GoalService } from './goal.service.js';
import { resolveOrgMemberIds } from '../utils/org-resolver.js';
import Category from '../models/category.model.js';
import type { RecurringRuleInterface, RecurringRuleCreateInput, RecurringRuleUpdateInput, RecurringRuleDTO } from '../types/recurring-rule.types.js';
import { BusinessError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const mapToDTO = (rule: RecurringRuleInterface, categoryName = 'Unknown'): RecurringRuleDTO => {
  const { deletedAt, ...dto } = rule;
  return { ...dto, categoryName };
};

function calcNextDate(currentNextDate: string, frequency: string, interval: number): string {
  const date = new Date(currentNextDate);
  switch (frequency) {
    case 'daily': date.setDate(date.getDate() + interval); break;
    case 'weekly': date.setDate(date.getDate() + 7 * interval); break;
    case 'monthly': date.setMonth(date.getMonth() + interval); break;
    case 'yearly': date.setFullYear(date.getFullYear() + interval); break;
  }
  return date.toISOString().split('T')[0] ?? '';
}

export const RecurringRuleService = {
  create: async (userId: string, data: RecurringRuleCreateInput, orgId?: string | null): Promise<RecurringRuleDTO> => {
    const rule = await RecurringRuleRepository.create(userId, data, orgId);
    const category = await Category.findByPk(rule.categoryId);
    return mapToDTO(rule, category?.name ?? 'Unknown');
  },

  findByUser: async (userId: string, active?: boolean, orgId?: string): Promise<RecurringRuleDTO[]> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const rules = await RecurringRuleRepository.findByUser(userId, active, orgContext);
    const dtos: RecurringRuleDTO[] = [];
    for (const r of rules) {
      const category = await Category.findByPk(r.categoryId);
      dtos.push(mapToDTO(r, category?.name ?? 'Unknown'));
    }
    return dtos;
  },

  findByIdAndUser: async (id: string, userId: string, orgId?: string): Promise<RecurringRuleDTO | null> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const rule = await RecurringRuleRepository.findByIdAndUser(id, userId, orgContext);
    if (!rule) return null;
    const category = await Category.findByPk(rule.categoryId);
    return mapToDTO(rule, category?.name ?? 'Unknown');
  },

  update: async (id: string, userId: string, data: RecurringRuleUpdateInput, orgId?: string): Promise<RecurringRuleDTO> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const updated = await RecurringRuleRepository.update(id, userId, data, orgContext);
    if (!updated) throw new BusinessError('Recurring rule not found', 404);
    return mapToDTO(updated);
  },

  delete: async (id: string, userId: string, orgId?: string): Promise<void> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const success = await RecurringRuleRepository.delete(id, userId, orgContext);
    if (!success) throw new BusinessError('Recurring rule not found', 404);
  },

  executeRule: async (ruleId: string, userId: string, orgId?: string): Promise<{ transactionId: string; nextDate: string }> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const rule = await RecurringRuleRepository.findByIdAndUser(ruleId, userId, orgContext);
    if (!rule) throw new BusinessError('Recurring rule not found', 404);
    if (!rule.active) throw new BusinessError('Recurring rule is inactive', 400);

    const today = new Date().toISOString().split('T')[0] ?? '';

    const transaction = await TransactionRepository.create(userId, {
      categoryId: rule.categoryId,
      description: rule.description,
      amount: rule.amount,
      type: rule.type,
      date: new Date(today),
      recurringRuleId: rule.id,
    }, orgId);

    const nextDate = calcNextDate(rule.nextDate, rule.frequency, rule.interval);

    if (rule.endDate && nextDate > rule.endDate) {
      await RecurringRuleRepository.deactivate(rule.id);
    } else {
      await RecurringRuleRepository.updateNextDate(rule.id, nextDate);
    }

    if (rule.type === 'outcome') {
      await BudgetService.recalcSpent(userId, rule.categoryId, new Date(today), orgContext);
      await GoalService.recalcCurrentAmount(userId, rule.categoryId, orgContext);
    }

    return { transactionId: transaction.id, nextDate: rule.endDate && nextDate > rule.endDate ? '' : nextDate };
  },

  processDueRules: async (): Promise<number> => {
    const dueRules = await RecurringRuleRepository.findDueRules();
    let count = 0;

    for (const rule of dueRules) {
      try {
        const today = new Date().toISOString().split('T')[0] ?? '';

        const orgId = rule.organizationId;
        let orgContext: { memberIds: string[]; orgId: string } | undefined;
        if (orgId) {
          orgContext = { memberIds: await resolveOrgMemberIds(orgId), orgId };
        }

        await TransactionRepository.create(rule.userId, {
          categoryId: rule.categoryId,
          description: rule.description,
          amount: rule.amount,
          type: rule.type,
          date: new Date(today),
          recurringRuleId: rule.id,
        }, orgId);

        const nextDate = calcNextDate(today, rule.frequency, rule.interval);

        if (rule.endDate && nextDate > rule.endDate) {
          await RecurringRuleRepository.deactivate(rule.id);
        } else {
          await RecurringRuleRepository.updateNextDate(rule.id, nextDate);
        }

        if (rule.type === 'outcome') {
          await BudgetService.recalcSpent(rule.userId, rule.categoryId, new Date(today), orgContext);
          await GoalService.recalcCurrentAmount(rule.userId, rule.categoryId, orgContext);
        }

        count++;
      } catch (error) {
        logger.error(`Failed to process recurring rule ${rule.id}`, error);
      }
    }

    return count;
  },
};
