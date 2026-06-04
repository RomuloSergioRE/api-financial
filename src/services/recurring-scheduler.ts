import cron from 'node-cron';
import { RecurringRuleService } from './recurring-rule.service.js';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository.js';
import { purgeSoftDeleted } from '../scripts/cleanup-soft-delete.js';
import { logger } from '../utils/logger.js';

export function startRecurringScheduler(): void {
  cron.schedule('0 * * * *', async () => {
    logger.info('Recurring scheduler: checking due rules...');
    try {
      const count = await RecurringRuleService.processDueRules();
      if (count > 0) {
        logger.info(`Recurring scheduler: ${count} transaction(s) generated.`);
      }
    } catch (error) {
      logger.error('Recurring scheduler error', error);
    }
  });

  cron.schedule('0 0 * * *', async () => {
    try {
      const count = await RefreshTokenRepository.deleteExpired();
      if (count > 0) {
        logger.info(`Cleanup scheduler: ${count} expired refresh token(s) removed.`);
      }
    } catch (error) {
      logger.error('Cleanup scheduler error', error);
    }
  });

  cron.schedule('0 0 1 * *', async () => {
    logger.info('Soft-delete purge scheduler: running monthly cleanup...');
    try {
      const total = await purgeSoftDeleted();
      if (total > 0) {
        logger.info(`Soft-delete purge scheduler: ${total} row(s) purged.`);
      }
    } catch (error) {
      logger.error('Soft-delete purge scheduler error', error);
    }
  });

  logger.info('Recurring scheduler started (runs every hour).');
  logger.info('Cleanup scheduler started (runs daily at midnight).');
  logger.info('Soft-delete purge scheduler started (runs monthly on the 1st).');
}
