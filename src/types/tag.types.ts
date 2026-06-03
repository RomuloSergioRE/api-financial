type SequelizeTimestamps = 'createdAt' | 'updatedAt' | 'deletedAt';

export interface TagInterface {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type TagCreateInput = Omit<TagInterface, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export type TagUpdateInput = Partial<Omit<TagInterface, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export type TagDTO = Omit<TagInterface, 'deletedAt'>;
