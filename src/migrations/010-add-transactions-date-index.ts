import type { Migration } from '../config/migration.js';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.addIndex('transactions', ['date'], { name: 'idx_transactions_date' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.removeIndex('transactions', 'idx_transactions_date');
};
