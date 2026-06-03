import type { Migration } from '../config/migration.js';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('tags', {
    id: { type: 'UUID', primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    user_id: { type: 'UUID', allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    name: { type: 'STRING', allowNull: false },
    color: { type: 'STRING', allowNull: true },
    created_at: { type: 'DATE', allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'DATE', allowNull: true },
  });

  await qi.createTable('transaction_tags', {
    transaction_id: { type: 'UUID', allowNull: false, references: { model: 'transactions', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    tag_id: { type: 'UUID', allowNull: false, references: { model: 'tags', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    created_at: { type: 'DATE', allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
  });

  await qi.addConstraint('transaction_tags', {
    type: 'primary key',
    name: 'transaction_tags_pkey',
    fields: ['transaction_id', 'tag_id'],
  });

  await qi.addIndex('tags', ['user_id'], { name: 'tags_user_id_idx' });
  await qi.addIndex('tags', ['user_id', 'deleted_at'], { name: 'tags_user_id_deleted_at_idx' });
  await qi.addIndex('transaction_tags', ['transaction_id'], { name: 'transaction_tags_transaction_id_idx' });
  await qi.addIndex('transaction_tags', ['tag_id'], { name: 'transaction_tags_tag_id_idx' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('transaction_tags');
  await qi.dropTable('tags');
};
