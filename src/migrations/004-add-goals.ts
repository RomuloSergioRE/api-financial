import type { Migration } from '../config/migration.js';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('goals', {
    id: { type: 'UUID', primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    user_id: { type: 'UUID', allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    category_id: { type: 'UUID', allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
    name: { type: 'VARCHAR(255)', allowNull: false },
    target_amount: { type: 'INTEGER', allowNull: false },
    current_amount: { type: 'INTEGER', allowNull: false, defaultValue: 0 },
    deadline: { type: 'DATEONLY', allowNull: true },
    created_at: { type: 'DATE', allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'DATE', allowNull: true },
  });

  await qi.addIndex('goals', ['user_id'], { name: 'goals_user_id_idx' });
  await qi.addIndex('goals', ['category_id'], { name: 'goals_category_id_idx' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('goals');
};
