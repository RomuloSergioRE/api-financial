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
      }
    ]
  }
);

export default Transaction;