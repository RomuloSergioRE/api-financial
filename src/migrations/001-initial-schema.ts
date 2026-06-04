import type { Migration } from '../config/migration.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('users', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'user', 'company'), allowNull: false, defaultValue: 'user' },
    status: { type: DataTypes.ENUM('active', 'inactive', 'suspended'), allowNull: false, defaultValue: 'active' },
    token_version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });

  await qi.createTable('categories', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    name: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING, allowNull: true },
    color: { type: DataTypes.STRING, allowNull: true },
    user_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });

  await qi.createTable('transactions', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    category_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'categories', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
    description: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('income', 'outcome'), allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });

  await qi.createTable('audit_logs', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    target_id: { type: DataTypes.UUID, allowNull: false },
    target_type: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
  });

  await qi.addIndex('users', ['email'], { name: 'users_email_unique_idx', unique: true });
  await qi.addIndex('users', ['role'], { name: 'users_role_idx' });
  await qi.addIndex('users', ['status'], { name: 'users_status_idx' });

  await qi.addIndex('categories', ['user_id'], { name: 'categories_user_id_idx' });
  await qi.addIndex('categories', ['user_id', 'deleted_at'], { name: 'categories_user_id_deleted_at_idx' });
  await qi.addIndex('categories', ['name'], { name: 'categories_name_idx' });

  await qi.addIndex('transactions', ['user_id'], { name: 'transactions_user_id_idx' });
  await qi.addIndex('transactions', ['user_id', 'deleted_at'], { name: 'transactions_user_id_deleted_at_idx' });
  await qi.addIndex('transactions', ['category_id'], { name: 'transactions_category_id_idx' });
  await qi.addIndex('transactions', ['category_id', 'deleted_at'], { name: 'transactions_category_id_deleted_at_idx' });
  await qi.addIndex('transactions', ['user_id', 'date'], { name: 'transactions_user_id_date_idx' });
  await qi.addIndex('transactions', ['user_id', 'type'], { name: 'transactions_user_id_type_idx' });

  await qi.addIndex('audit_logs', ['admin_id'], { name: 'audit_logs_admin_id_idx' });
  await qi.addIndex('audit_logs', ['target_id'], { name: 'audit_logs_target_id_idx' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('audit_logs');
  await qi.dropTable('transactions');
  await qi.dropTable('categories');
  await qi.dropTable('users');
};
