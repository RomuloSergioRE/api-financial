import type { Migration } from '../config/migration.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('refresh_tokens', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    family_id: { type: DataTypes.UUID, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });

  await qi.addIndex('refresh_tokens', ['user_id'], { name: 'idx_refresh_tokens_user' });
  await qi.addIndex('refresh_tokens', ['token_hash'], { name: 'idx_refresh_tokens_token_hash' });
  await qi.addIndex('refresh_tokens', ['family_id'], { name: 'idx_refresh_tokens_family' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('refresh_tokens');
};
