type SequelizeTimestamps = 'createdAt' | 'updatedAt' | 'deletedAt';

export interface CategoryInterface {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CategoryCreateInput = Omit<CategoryInterface, 'id' | SequelizeTimestamps> & {
  id?: string;
};

export type CategoryUpdateInput = Partial<Omit<CategoryInterface, 'id' | 'userId' | SequelizeTimestamps>>;

export type CategoryDTO = Omit<CategoryInterface, 'deletedAt'>;