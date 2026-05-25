import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/db.js';
import '../models/index.js';
import { SecurityHash } from '../utils/securityHash.util.js';
import { UserRepository } from '../repositories/user.repository.js';

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL || 'admin@financial.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const name = process.env.ADMIN_NAME || 'Administrator';

  await sequelize.authenticate();
  console.log('Database connected.');

  const existing = await UserRepository.findByEmailWithDeleted(email);
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    process.exit(0);
  }

  const hashedPassword = await SecurityHash.hashPassword(password);
  await UserRepository.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    status: 'active',
  } as any);

  console.log(`Admin user created successfully:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log('  Please change the password after first login.');
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error('Failed to seed admin:', error);
  process.exit(1);
});
