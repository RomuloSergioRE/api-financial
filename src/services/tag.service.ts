import { TagRepository } from '../repositories/tag.repository.js';
import type { TagCreateInput, TagUpdateInput, TagDTO, TagInterface } from '../types/tag.types.js';
import { BusinessError } from '../utils/errors.js';

const mapToTagDTO = (tag: TagInterface): TagDTO => {
  const { deletedAt, ...tagDto } = tag;
  return tagDto;
};

export const TagService = {
  create: async (userId: string, data: TagCreateInput): Promise<TagDTO> => {
    const tag = await TagRepository.create(userId, data);
    return mapToTagDTO(tag);
  },

  findByUser: async (userId: string): Promise<TagDTO[]> => {
    const tags = await TagRepository.findByUser(userId);
    return tags.map(mapToTagDTO);
  },

  findByIdAndUser: async (id: string, userId: string): Promise<TagDTO | null> => {
    const tag = await TagRepository.findByIdAndUser(id, userId);
    return tag ? mapToTagDTO(tag) : null;
  },

  update: async (id: string, userId: string, data: TagUpdateInput): Promise<TagDTO> => {
    const updated = await TagRepository.update(id, userId, data);
    if (!updated) {
      throw new BusinessError('Tag not found', 404);
    }
    return mapToTagDTO(updated);
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const success = await TagRepository.delete(id, userId);
    if (!success) {
      throw new BusinessError('Tag not found', 404);
    }
  },
};
