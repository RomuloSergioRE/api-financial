import Goal from '../models/goal.model.js';
import type { GoalInterface, GoalCreateInput, GoalUpdateInput } from '../types/goal.types.js';

export const GoalRepository = {
  create: async (userId: string, data: GoalCreateInput): Promise<GoalInterface> => {
    const goal = await Goal.create({ ...data, userId, currentAmount: 0 });
    return goal.dataValues as GoalInterface;
  },

  findByUser: async (userId: string): Promise<GoalInterface[]> => {
    const goals = await Goal.findAll({
      where: { userId },
      order: [['deadline', 'ASC NULLS LAST'], ['createdAt', 'DESC']],
    });
    return goals.map(g => g.dataValues as GoalInterface);
  },

  findByIdAndUser: async (id: string, userId: string): Promise<GoalInterface | null> => {
    const goal = await Goal.findOne({ where: { id, userId } });
    return goal ? (goal.dataValues as GoalInterface) : null;
  },

  update: async (id: string, userId: string, data: GoalUpdateInput): Promise<GoalInterface | null> => {
    const [affectedCount, affectedRows] = await Goal.update(data, {
      where: { id, userId },
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as GoalInterface;
  },

  delete: async (id: string, userId: string): Promise<boolean> => {
    const deleted = await Goal.destroy({ where: { id, userId } });
    return deleted > 0;
  },
};
