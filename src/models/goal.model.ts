import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import type { GoalInterface } from '../types/goal.types.js';

class Goal extends Model implements GoalInterface {
  declare id: string;
  declare userId: string;
  declare categoryId: string | null;
  declare name: string;
  declare targetAmount: number;
  declare currentAmount: number;
  declare deadline: string | null;
  declare organizationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Goal.init(
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
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'category_id',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    targetAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'target_amount',
    },
    currentAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'current_amount',
    },
    deadline: {
      type: DataTypes.DATEONLY,
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
    modelName: 'Goal',
    tableName: 'goals',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['user_id'], name: 'goals_user_id_idx' },
      { fields: ['category_id'], name: 'goals_category_id_idx' },
      { fields: ['organization_id'], name: 'goals_org_id_idx' },
    ],
  }
);

export default Goal;
