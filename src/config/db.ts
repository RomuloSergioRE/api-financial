import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// dotenv é carregado no server.ts — mantido aqui apenas como fallback para scripts isolados
dotenv.config();

let dbName = process.env.DB_NAME;
let dbUser = process.env.DB_USER;
let dbPass = process.env.DB_PASS;
let dbHost = process.env.DB_HOST;
let dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const useSSL = process.env.DB_USE_SSL === 'true';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

if (!dbName && !dbHost && process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  dbHost = url.hostname;
  dbPort = url.port ? parseInt(url.port, 10) : 5432;
  dbUser = decodeURIComponent(url.username);
  dbPass = decodeURIComponent(url.password);
  dbName = url.pathname.slice(1);
}

if (!dbName || !dbUser || !dbPass || !dbHost) {
  throw new Error('❌ Missing database environment variables.');
}

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  },
  dialectOptions: useSSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized,
        },
      }
    : {},
});

export default sequelize;