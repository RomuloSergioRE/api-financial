import type { Migration } from '../config/migration.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.addColumn('users', 'currency', {
    type: DataTypes.STRING(3),
    defaultValue: 'BRL',
    allowNull: false,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.removeColumn('users', 'currency');
};
