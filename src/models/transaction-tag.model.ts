import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

export interface TransactionTagInterface {
  transactionId: string;
  tagId: string;
  createdAt?: Date;
}

class TransactionTag extends Model implements TransactionTagInterface {
  declare transactionId: string;
  declare tagId: string;
  declare readonly createdAt: Date;
}

TransactionTag.init(
  {
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'transaction_id',
      primaryKey: true,
    },
    tagId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tag_id',
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'TransactionTag',
    tableName: 'transaction_tags',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['transaction_id'], name: 'transaction_tags_transaction_id_idx' },
      { fields: ['tag_id'], name: 'transaction_tags_tag_id_idx' },
    ],
  }
);

export default TransactionTag;
