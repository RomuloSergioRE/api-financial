import app from './app.js';
import sequelize from './config/db.js';
import dotenv from 'dotenv';
import { migrator } from './config/migration.js';
import { logger } from './utils/logger.js';
import './models/index.js';
import { startRecurringScheduler } from './services/recurring-scheduler.js';
import { autoSeed } from './config/auto-seed.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

function validateRequiredEnvs(): void {
  const required = ['DB_NAME', 'DB_USER', 'DB_PASS', 'DB_HOST', 'JWT_SECRET'];
  const missing = required.filter(env => !process.env[env]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

let server: ReturnType<typeof app.listen>;

async function startServer(): Promise<void> {
  try {
    validateRequiredEnvs();
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    const executed = await migrator.up();
    if (executed.length > 0) {
      logger.info(`Migrations executed: ${executed.map(m => m.name).join(', ')}`);
    } else {
      logger.info('No pending migrations to execute.');
    }

    startRecurringScheduler();

    await autoSeed();

    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Unable to start server', error);
    process.exit(1);
  }
}

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      sequelize.close().then(() => {
        logger.info('Database connection closed.');
        process.exit(0);
      }).catch((err) => {
        logger.error('Error closing database connection', err);
        process.exit(1);
      });
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

void startServer();