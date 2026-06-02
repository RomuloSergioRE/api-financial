import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/db.js';
import '../models/index.js';
import { User, Category, Transaction } from '../models/index.js';

const transactions = [
  { description: 'Salário mensal', amount: 500000, type: 'income', categoryName: 'Salário', day: 2 },
  { description: 'Supermercado', amount: 18990, type: 'outcome', categoryName: 'Alimentação', day: 5 },
  { description: 'Aluguel', amount: 120000, type: 'outcome', categoryName: 'Moradia', day: 6 },
  { description: 'Gasolina', amount: 17550, type: 'outcome', categoryName: 'Transporte', day: 7 },
  { description: 'Jantar fora', amount: 8990, type: 'outcome', categoryName: 'Lazer', day: 8 },
  { description: 'Freela', amount: 80000, type: 'income', categoryName: 'Salário', day: 10 },
  { description: 'Feira', amount: 6530, type: 'outcome', categoryName: 'Alimentação', day: 12 },
  { description: 'Conta de luz', amount: 14280, type: 'outcome', categoryName: 'Moradia', day: 15 },
  { description: 'Uber', amount: 3450, type: 'outcome', categoryName: 'Transporte', day: 17 },
  { description: 'Cinema', amount: 4800, type: 'outcome', categoryName: 'Lazer', day: 19 },
  { description: 'Restaurante', amount: 15600, type: 'outcome', categoryName: 'Alimentação', day: 22 },
  { description: 'Bônus', amount: 100000, type: 'income', categoryName: 'Salário', day: 24 },
  { description: 'Passagem de ônibus', amount: 22000, type: 'outcome', categoryName: 'Transporte', day: 26 },
  { description: 'Streaming', amount: 5590, type: 'outcome', categoryName: 'Lazer', day: 28 },
  { description: 'Açougue', amount: 9750, type: 'outcome', categoryName: 'Alimentação', day: 30 },
];

const seedDescriptions = transactions.map(t => t.description);

async function seedTransactions() {
  await sequelize.authenticate();
  console.log('Database connected.');

  const email = process.env.SEED_USER_EMAIL || 'romuloteste1@teste.com';
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}. Create the user first via the app.`);
    process.exit(1);
  }
  console.log(`Using user: ${user.id} (${user.email})`);

  const categories = await Category.findAll();
  if (categories.length === 0) {
    console.error('No categories found. Create categories first via the app.');
    process.exit(1);
  }
  console.log(`Found ${categories.length} categories.`);

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.name, cat.id);
  }

  const missing = transactions.find((t) => !categoryMap.has(t.categoryName));
  if (missing) {
    console.error(`Category not found: "${missing.categoryName}". Create it first.`);
    process.exit(1);
  }

  const deleted = await Transaction.destroy({ where: { description: seedDescriptions, userId: user.id } });
  if (deleted > 0) console.log(`Deleted ${deleted} existing seed transactions.`);

  let created = 0;
  for (const t of transactions) {
    const date = new Date(2026, 5, t.day, 12, 0, 0);
    const categoryId = categoryMap.get(t.categoryName)!;
    await Transaction.create({
      userId: user.id,
      categoryId,
      description: t.description,
      amount: t.amount,
      type: t.type as 'income' | 'outcome',
      date,
    });
    created++;
    console.log(`[${created}/${transactions.length}] ${t.description} — R$ ${(t.amount / 100).toFixed(2)}`);
  }

  console.log(`\n✓ ${created} transactions created successfully.`);
  process.exit(0);
}

seedTransactions().catch((error) => {
  console.error('Failed to seed transactions:', error);
  process.exit(1);
});
