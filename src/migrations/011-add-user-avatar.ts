import type { Migration } from '../config/migration.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.addColumn('users', 'avatar_url', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.removeColumn('users', 'avatar_url');
};
