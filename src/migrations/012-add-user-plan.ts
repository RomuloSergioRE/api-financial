import type { Migration } from '../config/migration.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.addColumn('users', 'plan', {
    type: DataTypes.ENUM('free', 'pro', 'enterprise'),
    defaultValue: 'free',
    allowNull: false,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.removeColumn('users', 'plan');
};
