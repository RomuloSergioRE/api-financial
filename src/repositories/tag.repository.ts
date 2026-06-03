import { Op } from 'sequelize';
import { Tag } from '../models/index.js';
import type { TagInterface, TagCreateInput, TagUpdateInput } from '../types/tag.types.js';

export const TagRepository = {
  create: async (userId: string, data: TagCreateInput): Promise<TagInterface> => {
    const tag = await Tag.create({ ...data, userId });
    return tag.dataValues as TagInterface;
  },

  findByUser: async (userId: string): Promise<TagInterface[]> => {
    const tags = await Tag.findAll({ where: { userId }, order: [['name', 'ASC']] });
    return tags.map(t => t.dataValues as TagInterface);
  },

  findByIdAndUser: async (id: string, userId: string): Promise<TagInterface | null> => {
    const tag = await Tag.findOne({ where: { id, userId } });
    return tag ? (tag.dataValues as TagInterface) : null;
  },

  update: async (id: string, userId: string, data: TagUpdateInput): Promise<TagInterface | null> => {
    const [affectedCount, affectedRows] = await Tag.update(data, {
      where: { id, userId },
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as TagInterface;
  },

  delete: async (id: string, userId: string): Promise<boolean> => {
    const deleted = await Tag.destroy({ where: { id, userId } });
    return deleted > 0;
  },
};
