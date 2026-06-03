import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './db.js';

const isProduction = process.env.NODE_ENV === 'production';

export const migrator = new Umzug({
  migrations: {
    glob: isProduction
      ? ['dist/migrations/*.js', { cwd: process.cwd() }]
      : ['src/migrations/*.ts', { cwd: process.cwd() }],
  },
  context: sequelize,
  storage: new SequelizeStorage({
    sequelize,
    tableName: 'sequelize_meta',
  }),
  logger: undefined,
});

export type Migration = typeof migrator._types.migration;
