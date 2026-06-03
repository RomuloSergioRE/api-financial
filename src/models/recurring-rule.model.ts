import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import type { RecurringRuleInterface } from '../types/recurring-rule.types.js';

class RecurringRule extends Model implements RecurringRuleInterface {
  declare id: string;
  declare userId: string;
  declare categoryId: string;
  declare description: string;
  declare amount: number;
  declare type: 'income' | 'outcome';
  declare frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  declare interval: number;
  declare nextDate: string;
  declare endDate: string | null;
  declare active: boolean;
  declare organizationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

RecurringRule.init(
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
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    interval: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'interval',
    },
    nextDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'next_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date',
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organization_id',
    },
  },
  {
    sequelize,
    modelName: 'RecurringRule',
    tableName: 'recurring_rules',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['user_id'], name: 'recurring_rules_user_id_idx' },
      { fields: ['next_date', 'active'], name: 'recurring_rules_next_date_active_idx' },
      { fields: ['user_id', 'active'], name: 'recurring_rules_user_id_active_idx' },
      { fields: ['organization_id'], name: 'recurring_rules_org_id_idx' },
    ],
  }
);

export default RecurringRule;
