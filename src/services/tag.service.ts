import { TagRepository } from '../repositories/tag.repository.js';
import type { TagCreateInput, TagUpdateInput, TagDTO, TagInterface } from '../types/tag.types.js';
import { resolveOrgMemberIds } from '../utils/org-resolver.js';
import { BusinessError } from '../utils/errors.js';

const mapToTagDTO = (tag: TagInterface): TagDTO => {
  const { deletedAt, ...tagDto } = tag;
  return tagDto;
};

export const TagService = {
  create: async (userId: string, data: TagCreateInput, orgId?: string | null): Promise<TagDTO> => {
    const tag = await TagRepository.create(userId, data, orgId);
    return mapToTagDTO(tag);
  },

  findByUser: async (userId: string, orgId?: string): Promise<TagDTO[]> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const tags = await TagRepository.findByUser(userId, orgContext);
    return tags.map(mapToTagDTO);
  },

  findByIdAndUser: async (id: string, userId: string, orgId?: string): Promise<TagDTO | null> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const tag = await TagRepository.findByIdAndUser(id, userId, orgContext);
    return tag ? mapToTagDTO(tag) : null;
  },

  update: async (id: string, userId: string, data: TagUpdateInput, orgId?: string): Promise<TagDTO> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const updated = await TagRepository.update(id, userId, data, orgContext);
    if (!updated) {
      throw new BusinessError('Tag not found', 404);
    }
    return mapToTagDTO(updated);
  },

  delete: async (id: string, userId: string, orgId?: string): Promise<void> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const success = await TagRepository.delete(id, userId, orgContext);
    if (!success) {
      throw new BusinessError('Tag not found', 404);
    }
  },
};
