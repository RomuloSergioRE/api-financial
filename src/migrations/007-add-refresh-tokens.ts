import type { Migration } from '../config/migration.js';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('refresh_tokens', {
    id: { type: 'UUID', primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    user_id: { type: 'UUID', allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    token_hash: { type: 'VARCHAR(64)', allowNull: false, unique: true },
    family_id: { type: 'UUID', allowNull: false },
    expires_at: { type: 'DATE', allowNull: false },
    used_at: { type: 'DATE', allowNull: true },
    revoked_at: { type: 'DATE', allowNull: true },
    created_at: { type: 'DATE', allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'DATE', allowNull: true },
  });

  await qi.addIndex('refresh_tokens', ['user_id'], { name: 'idx_refresh_tokens_user' });
  await qi.addIndex('refresh_tokens', ['token_hash'], { name: 'idx_refresh_tokens_token_hash' });
  await qi.addIndex('refresh_tokens', ['family_id'], { name: 'idx_refresh_tokens_family' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('refresh_tokens');
};
