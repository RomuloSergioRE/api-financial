import { Op } from 'sequelize';
import { Tag } from '../models/index.js';
import type { TagInterface, TagCreateInput, TagUpdateInput } from '../types/tag.types.js';

interface OrgContext {
  memberIds: string[];
  orgId: string;
}

export const TagRepository = {
  create: async (userId: string, data: TagCreateInput, orgId?: string | null): Promise<TagInterface> => {
    const tag = await Tag.create({ ...data, userId, organizationId: orgId || null });
    return tag.dataValues as TagInterface;
  },

  findByUser: async (userId: string, orgContext?: OrgContext): Promise<TagInterface[]> => {
    const where: Record<string, unknown> = {};

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
      where.organizationId = null;
    }

    const tags = await Tag.findAll({ where, order: [['name', 'ASC']] });
    return tags.map(t => t.dataValues as TagInterface);
  },

  findByIdAndUser: async (id: string, userId: string, orgContext?: OrgContext): Promise<TagInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const tag = await Tag.findOne({ where });
    return tag ? (tag.dataValues as TagInterface) : null;
  },

  update: async (id: string, userId: string, data: TagUpdateInput, orgContext?: OrgContext): Promise<TagInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const [affectedCount, affectedRows] = await Tag.update(data, {
      where,
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as TagInterface;
  },

  delete: async (id: string, userId: string, orgContext?: OrgContext): Promise<boolean> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const deleted = await Tag.destroy({ where });
    return deleted > 0;
  },
};
