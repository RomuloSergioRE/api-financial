import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import type { TagInterface } from '../types/tag.types.js';

class Tag extends Model implements TagInterface {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare color: string | null;
  declare organizationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Tag.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organization_id',
    },
  },
  {
    sequelize,
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['user_id'], name: 'tags_user_id_idx' },
      { fields: ['user_id', 'deleted_at'], name: 'tags_user_id_deleted_at_idx' },
      { fields: ['organization_id'], name: 'tags_org_id_idx' },
    ],
  }
);

export default Tag;
