import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../migrations');

const nameIndex = process.argv.indexOf('--name');
const migrationName = nameIndex !== -1 ? process.argv[nameIndex + 1] : '';

if (!migrationName) {
  console.error('Usage: npm run migration:create -- --name <migration-name>');
  process.exit(1);
}

const existing = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.ts'))
  .map(f => parseInt(f.split('-')[0] || '0', 10))
  .filter(n => !isNaN(n));

const nextNumber = existing.length > 0 ? Math.max(...existing) + 1 : 1;
const padded = String(nextNumber).padStart(3, '0');
const filename = `${padded}-${migrationName}.ts`;
const filepath = path.join(migrationsDir, filename);

const template = `import type { Migration } from '../config/migration.js';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  // TODO: implementar up migration
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  // TODO: implementar down migration
};
`;

fs.writeFileSync(filepath, template, 'utf-8');
console.log(`Created migration: ${filename}`);
