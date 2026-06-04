import type { Migration } from '../config/migration.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('organizations', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    name: { type: DataTypes.STRING(255), allowNull: false },
    owner_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
  });

  await qi.createTable('organization_members', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    organization_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'organizations', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    role: { type: DataTypes.ENUM('admin', 'finance', 'viewer'), allowNull: false, defaultValue: 'viewer' },
    status: { type: DataTypes.ENUM('active', 'pending'), allowNull: false, defaultValue: 'pending' },
    invited_by: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
  });

  await qi.addConstraint('organization_members', {
    type: 'unique',
    fields: ['organization_id', 'user_id'],
    name: 'org_members_org_user_unique',
  });

  await qi.addIndex('organization_members', ['organization_id'], { name: 'org_members_org_id_idx' });
  await qi.addIndex('organization_members', ['user_id'], { name: 'org_members_user_id_idx' });

  await qi.addColumn('transactions', 'organization_id', {
    type: DataTypes.UUID, allowNull: true, references: { model: 'organizations', key: 'id' }, onDelete: 'SET NULL',
  });
  await qi.addColumn('categories', 'organization_id', {
    type: DataTypes.UUID, allowNull: true, references: { model: 'organizations', key: 'id' }, onDelete: 'SET NULL',
  });
  await qi.addColumn('budgets', 'organization_id', {
    type: DataTypes.UUID, allowNull: true, references: { model: 'organizations', key: 'id' }, onDelete: 'SET NULL',
  });
  await qi.addColumn('goals', 'organization_id', {
    type: DataTypes.UUID, allowNull: true, references: { model: 'organizations', key: 'id' }, onDelete: 'SET NULL',
  });
  await qi.addColumn('tags', 'organization_id', {
    type: DataTypes.UUID, allowNull: true, references: { model: 'organizations', key: 'id' }, onDelete: 'SET NULL',
  });
  await qi.addColumn('recurring_rules', 'organization_id', {
    type: DataTypes.UUID, allowNull: true, references: { model: 'organizations', key: 'id' }, onDelete: 'SET NULL',
  });

  await qi.addIndex('transactions', ['organization_id'], { name: 'transactions_org_id_idx' });
  await qi.addIndex('categories', ['organization_id'], { name: 'categories_org_id_idx' });
  await qi.addIndex('budgets', ['organization_id'], { name: 'budgets_org_id_idx' });
  await qi.addIndex('goals', ['organization_id'], { name: 'goals_org_id_idx' });
  await qi.addIndex('tags', ['organization_id'], { name: 'tags_org_id_idx' });
  await qi.addIndex('recurring_rules', ['organization_id'], { name: 'recurring_rules_org_id_idx' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.removeIndex('recurring_rules', 'recurring_rules_org_id_idx');
  await qi.removeIndex('tags', 'tags_org_id_idx');
  await qi.removeIndex('goals', 'goals_org_id_idx');
  await qi.removeIndex('budgets', 'budgets_org_id_idx');
  await qi.removeIndex('categories', 'categories_org_id_idx');
  await qi.removeIndex('transactions', 'transactions_org_id_idx');

  await qi.removeColumn('recurring_rules', 'organization_id');
  await qi.removeColumn('tags', 'organization_id');
  await qi.removeColumn('goals', 'organization_id');
  await qi.removeColumn('budgets', 'organization_id');
  await qi.removeColumn('categories', 'organization_id');
  await qi.removeColumn('transactions', 'organization_id');

  await qi.dropTable('organization_members');
  await qi.dropTable('organizations');
};
