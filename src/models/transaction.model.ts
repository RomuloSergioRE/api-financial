import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import type { TransactionInterface } from '../types/transaction.types.js';

type Type = 'income' | 'outcome';

class Transaction extends Model implements TransactionInterface {
  declare id: string;
  declare userId: string;
  declare categoryId: string;
  declare description: string;
  declare amount: number;
  declare type: Type;
  declare date: Date;
  declare recurringRuleId: string | null;
  declare organizationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      field: 'userId',
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      field: 'categoryId', 
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('income', 'outcome'),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    recurringRuleId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'recurring_rule_id',
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organization_id',
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'transactions_user_id_idx'
      },
      {
        fields: ['userId', 'deleted_at'],
        name: 'transactions_user_id_deleted_at_idx'
      },
      {
        fields: ['categoryId'],
        name: 'transactions_category_id_idx'
      },
      {
        fields: ['categoryId', 'deleted_at'],
        name: 'transactions_category_id_deleted_at_idx'
      },
      {
        fields: ['userId', 'date'],
        name: 'transactions_user_id_date_idx'
      },
      {
        fields: ['userId', 'type'],
        name: 'transactions_user_id_type_idx'
      },
      {
        fields: ['recurring_rule_id'],
        name: 'transactions_recurring_rule_id_idx'
      },
      {
        fields: ['organization_id'],
        name: 'transactions_org_id_idx'
      }
    ]
  }
);

export default Transaction;