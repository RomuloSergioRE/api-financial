import sequelize from './db.js';
import '../models/index.js';
import { SecurityHash } from '../utils/securityHash.util.js';
import { UserRepository } from '../repositories/user.repository.js';
import { Category, Transaction } from '../models/index.js';
import { logger } from '../utils/logger.js';

const DEMO_EMAIL = 'demo@zenyfin.app';
const DEMO_PASSWORD = 'Demo@123456';
const DEMO_NAME = 'Usuário Demo';

const DEFAULT_CATEGORIES = [
  { name: 'Salário', icon: 'briefcase', color: '#3B82F6' },
  { name: 'Alimentação', icon: 'shopping-cart', color: '#F59E0B' },
  { name: 'Moradia', icon: 'home', color: '#EF4444' },
  { name: 'Transporte', icon: 'truck', color: '#8B5CF6' },
  { name: 'Lazer', icon: 'gamepad-2', color: '#EC4899' },
  { name: 'Freelas', icon: 'laptop', color: '#10B981' },
  { name: 'Saúde', icon: 'heart-pulse', color: '#06B6D4' },
  { name: 'Educação', icon: 'book-open', color: '#F97316' },
];

const SAMPLE_TRANSACTIONS = [
  { description: 'Salário mensal', amount: 500000, type: 'income' as const, categoryName: 'Salário', day: 5 },
  { description: 'Supermercado', amount: 18990, type: 'outcome' as const, categoryName: 'Alimentação', day: 3 },
  { description: 'Aluguel', amount: 120000, type: 'outcome' as const, categoryName: 'Moradia', day: 1 },
  { description: 'Gasolina', amount: 17550, type: 'outcome' as const, categoryName: 'Transporte', day: 7 },
  { description: 'Jantar fora', amount: 8990, type: 'outcome' as const, categoryName: 'Lazer', day: 10 },
  { description: 'Freela site', amount: 250000, type: 'income' as const, categoryName: 'Freelas', day: 15 },
  { description: 'Plano de saúde', amount: 8900, type: 'outcome' as const, categoryName: 'Saúde', day: 8 },
  { description: 'Curso online', amount: 19990, type: 'outcome' as const, categoryName: 'Educação', day: 12 },
  { description: 'Feira', amount: 6530, type: 'outcome' as const, categoryName: 'Alimentação', day: 14 },
  { description: 'Conta de luz', amount: 14280, type: 'outcome' as const, categoryName: 'Moradia', day: 16 },
  { description: 'Uber', amount: 3450, type: 'outcome' as const, categoryName: 'Transporte', day: 18 },
  { description: 'Cinema', amount: 4800, type: 'outcome' as const, categoryName: 'Lazer', day: 20 },
  { description: 'Aplicativo de saúde', amount: 2990, type: 'outcome' as const, categoryName: 'Saúde', day: 22 },
  { description: 'Restaurante', amount: 15600, type: 'outcome' as const, categoryName: 'Alimentação', day: 23 },
  { description: 'Bônus', amount: 100000, type: 'income' as const, categoryName: 'Salário', day: 25 },
  { description: 'Passagem de ônibus', amount: 22000, type: 'outcome' as const, categoryName: 'Transporte', day: 26 },
  { description: 'Streaming', amount: 5590, type: 'outcome' as const, categoryName: 'Lazer', day: 28 },
  { description: 'Açougue', amount: 9750, type: 'outcome' as const, categoryName: 'Alimentação', day: 30 },
  { description: 'Livro técnico', amount: 7990, type: 'outcome' as const, categoryName: 'Educação', day: 17 },
  { description: 'Freela consultoria', amount: 150000, type: 'income' as const, categoryName: 'Freelas', day: 20 },
];

async function autoSeed(): Promise<void> {
  try {
    await sequelize.authenticate();

    const existingUser = await UserRepository.findByEmailWithDeleted(DEMO_EMAIL);
    if (existingUser) {
      logger.info(`Demo user already exists: ${DEMO_EMAIL}`);
      return;
    }

    logger.info('Creating demo user...');
    const hashedPassword = await SecurityHash.hashPassword(DEMO_PASSWORD);
    const user = await UserRepository.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: hashedPassword,
      role: 'user',
      status: 'active',
      plan: 'pro',
      currency: 'BRL',
      locale: 'pt-BR',
    } as any);

    logger.info(`Creating ${DEFAULT_CATEGORIES.length} default categories...`);
    const categoryMap = new Map<string, string>();
    for (const cat of DEFAULT_CATEGORIES) {
      const created = await Category.create({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        userId: user.id,
      });
      categoryMap.set(cat.name, created.id);
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let created = 0;
    for (const t of SAMPLE_TRANSACTIONS) {
      const date = new Date(currentYear, currentMonth, t.day, 12, 0, 0);
      const categoryId = categoryMap.get(t.categoryName);
      if (!categoryId) {
        logger.warn(`Category not found: ${t.categoryName}, skipping transaction`);
        continue;
      }
      await Transaction.create({
        userId: user.id,
        categoryId,
        description: t.description,
        amount: t.amount,
        type: t.type,
        date,
      });
      created++;
    }

    logger.info(`✓ Demo user created: ${DEMO_EMAIL} (plan: pro, role: user)`);
    logger.info(`✓ ${DEFAULT_CATEGORIES.length} categories and ${created} transactions seeded`);
  } catch (error) {
    logger.error('Auto-seed failed (non-fatal)', error);
  }
}

export { autoSeed };
