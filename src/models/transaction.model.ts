import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';
import type { TransactionInterface, TransactionCreation } from '../types/transaction.types.js';

class Transaction extends Model<TransactionInterface, TransactionCreation> implements TransactionInterface {
  public id!: string;
  public type!: 'income' | 'expense';
  public amount!: number;
  public description!: string;
  public date!: Date;
  public status!: 'active' | 'inactive';
  public userId!: string;
  public categoryId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('amount');
        return value ? parseFloat(value as unknown as string) : 0;
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'categories', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'transactions',
  }
);

export default Transaction;