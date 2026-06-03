import cron from 'node-cron';
import { RecurringRuleService } from './recurring-rule.service.js';
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

  logger.info('Recurring scheduler started (runs every hour).');
}
