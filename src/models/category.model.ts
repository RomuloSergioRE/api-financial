import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import type { CategoryInterface, CategoryCreateInput } from '../types/category.types.js';

type SequelizeTimestamps = 'createdAt' | 'updatedAt' | 'deletedAt';

class Category extends Model<Omit<CategoryInterface, SequelizeTimestamps>, CategoryCreateInput> implements CategoryInterface {
  declare id: string;
  declare name: string;
  declare icon: string | null;
  declare color: string | null;
  declare userId: string | null;
  declare organizationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      field: 'userId',
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organization_id',
    },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'categories_user_id_idx',
      },
      {
        fields: ['userId', 'deleted_at'],
        name: 'categories_user_id_deleted_at_idx',
      },
      {
        fields: ['name'],
        name: 'categories_name_idx',
      },
      {
        fields: ['organization_id'],
        name: 'categories_org_id_idx',
      },
    ],
  }
);

export default Category;