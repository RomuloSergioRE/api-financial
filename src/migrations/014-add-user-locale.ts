import type { Migration } from '../config/migration.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.addColumn('users', 'locale', {
    type: DataTypes.STRING(5),
    defaultValue: 'pt-BR',
    allowNull: false,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.removeColumn('users', 'locale');
};
