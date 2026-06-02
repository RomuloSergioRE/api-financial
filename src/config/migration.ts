import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './db.js';

export const migrator = new Umzug({
  migrations: {
    glob: ['src/migrations/*.ts', { cwd: process.cwd() }],
  },
  context: sequelize,
  storage: new SequelizeStorage({
    sequelize,
    tableName: 'sequelize_meta',
  }),
  logger: undefined,
});

export type Migration = typeof migrator._types.migration;
