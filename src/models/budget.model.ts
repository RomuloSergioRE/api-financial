import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import type { BudgetInterface } from '../types/budget.types.js';

class Budget extends Model implements BudgetInterface {
  declare id: string;
  declare userId: string;
  declare categoryId: string;
  declare month: number;
  declare year: number;
  declare limit: number;
  declare spent: number;
  declare organizationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Budget.init(
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
      allowNull: false,
      field: 'category_id',
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    spent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organization_id',
    },
  },
  {
    sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['user_id', 'category_id', 'month', 'year', 'organization_id'], unique: true, name: 'budgets_user_cat_month_year_org_uniq' },
      { fields: ['organization_id'], name: 'budgets_org_id_idx' },
    ],
  }
);

export default Budget;
