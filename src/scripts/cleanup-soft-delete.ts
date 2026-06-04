import sequelize from '../config/db.js';
import { logger } from '../utils/logger.js';

const TABLES: Array<{ table: string; retentionMonths: number }> = [
  { table: 'transactions', retentionMonths: 12 },
  { table: 'categories', retentionMonths: 12 },
  { table: 'budgets', retentionMonths: 12 },
  { table: 'goals', retentionMonths: 12 },
  { table: 'tags', retentionMonths: 12 },
  { table: 'recurring_rules', retentionMonths: 12 },
  { table: 'users', retentionMonths: 12 },
  { table: 'refresh_tokens', retentionMonths: 3 },
];

export async function purgeSoftDeleted(): Promise<number> {
  let total = 0;

  for (const { table, retentionMonths } of TABLES) {
    const [, meta] = await sequelize.query(
      `DELETE FROM "${table}" WHERE "deleted_at" IS NOT NULL AND "deleted_at" < NOW() - INTERVAL '${retentionMonths} months'`,
    );
    const count = Number((meta as { rowCount?: number }).rowCount ?? 0);
    if (count > 0) {
      logger.info(`Cleanup: purged ${count} row(s) from ${table}`);
      total += count;
    }
  }

  return total;
}
