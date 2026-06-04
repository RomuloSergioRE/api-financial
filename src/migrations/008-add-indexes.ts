import type { Migration } from '../config/migration.js';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.addIndex('refresh_tokens', ['expires_at'], { name: 'idx_refresh_tokens_expires_at' });
  await qi.addIndex('audit_logs', ['action', 'created_at'], { name: 'idx_audit_logs_action_created' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.removeIndex('refresh_tokens', 'idx_refresh_tokens_expires_at');
  await qi.removeIndex('audit_logs', 'idx_audit_logs_action_created');
};
