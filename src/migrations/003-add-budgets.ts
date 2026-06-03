import type { Migration } from '../config/migration.js';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('budgets', {
    id: { type: 'UUID', primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    user_id: { type: 'UUID', allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    category_id: { type: 'UUID', allowNull: false, references: { model: 'categories', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
    month: { type: 'INTEGER', allowNull: false },
    year: { type: 'INTEGER', allowNull: false },
    limit: { type: 'INTEGER', allowNull: false },
    spent: { type: 'INTEGER', allowNull: false, defaultValue: 0 },
    created_at: { type: 'DATE', allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'DATE', allowNull: true },
  });

  await qi.addConstraint('budgets', {
    type: 'unique',
    name: 'budgets_user_category_month_year_unique',
    fields: ['user_id', 'category_id', 'month', 'year'],
  });

  await qi.addIndex('budgets', ['user_id', 'year', 'month'], { name: 'budgets_user_year_month_idx' });
  await qi.addIndex('budgets', ['user_id', 'category_id', 'deleted_at'], { name: 'budgets_user_category_deleted_at_idx' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('budgets');
};
