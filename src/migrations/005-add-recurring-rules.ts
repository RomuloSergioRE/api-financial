import type { Migration } from '../config/migration.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('recurring_rules', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    category_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'categories', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
    description: { type: DataTypes.STRING(255), allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    frequency: { type: DataTypes.STRING(20), allowNull: false },
    interval: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    next_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });

  await qi.addIndex('recurring_rules', ['user_id'], { name: 'recurring_rules_user_id_idx' });
  await qi.addIndex('recurring_rules', ['next_date', 'active'], { name: 'recurring_rules_next_date_active_idx' });
  await qi.addIndex('recurring_rules', ['user_id', 'active'], { name: 'recurring_rules_user_id_active_idx' });

  await qi.addColumn('transactions', 'recurring_rule_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'recurring_rules', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  await qi.addIndex('transactions', ['recurring_rule_id'], { name: 'transactions_recurring_rule_id_idx' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.removeIndex('transactions', 'transactions_recurring_rule_id_idx');
  await qi.removeColumn('transactions', 'recurring_rule_id');
  await qi.dropTable('recurring_rules');
};
