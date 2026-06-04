import type { Migration } from '../config/migration.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('goals', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    category_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
    name: { type: DataTypes.STRING(255), allowNull: false },
    target_amount: { type: DataTypes.INTEGER, allowNull: false },
    current_amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    deadline: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });

  await qi.addIndex('goals', ['user_id'], { name: 'goals_user_id_idx' });
  await qi.addIndex('goals', ['category_id'], { name: 'goals_category_id_idx' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('goals');
};
