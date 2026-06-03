import User from './user.model.js';
import Transaction from './transaction.model.js';
import Category from './category.model.js';
import AuditLog from './audit.model.js';
import Tag from './tag.model.js';
import TransactionTag from './transaction-tag.model.js';
import Budget from './budget.model.js';
import Goal from './goal.model.js';
import RecurringRule from './recurring-rule.model.js';
import Organization from './organization.model.js';
import OrganizationMember from './organization-member.model.js';

// User -> Transaction
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Category
User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Category -> Transaction
Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// User -> Tag
User.hasMany(Tag, { foreignKey: 'userId', as: 'tags' });
Tag.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Transaction <-> Tag (N:N)
Transaction.belongsToMany(Tag, {
  through: TransactionTag,
  foreignKey: 'transactionId',
  otherKey: 'tagId',
  as: 'tags',
});
Tag.belongsToMany(Transaction, {
  through: TransactionTag,
  foreignKey: 'tagId',
  otherKey: 'transactionId',
  as: 'transactions',
});

// Direct associations for reading the through table
TransactionTag.belongsTo(Tag, { foreignKey: 'tagId', as: 'tag' });
TransactionTag.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transactionLink' });

// User -> Budget
User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Category -> Budget
Category.hasMany(Budget, { foreignKey: 'categoryId', as: 'budgets' });
Budget.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// User -> Goal
User.hasMany(Goal, { foreignKey: 'userId', as: 'goals' });
Goal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Category -> Goal
Category.hasMany(Goal, { foreignKey: 'categoryId', as: 'goals' });
Goal.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// User -> RecurringRule
User.hasMany(RecurringRule, { foreignKey: 'userId', as: 'recurringRules' });
RecurringRule.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Category -> RecurringRule
Category.hasMany(RecurringRule, { foreignKey: 'categoryId', as: 'recurringRules' });
RecurringRule.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Transaction -> RecurringRule
Transaction.belongsTo(RecurringRule, { foreignKey: 'recurringRuleId', as: 'recurringRule' });
RecurringRule.hasMany(Transaction, { foreignKey: 'recurringRuleId', as: 'transactions' });

// Organization -> Members
Organization.hasMany(OrganizationMember, { foreignKey: 'organizationId', as: 'members' });
OrganizationMember.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

// OrganizationMember -> User
OrganizationMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(OrganizationMember, { foreignKey: 'userId', as: 'organizationMemberships' });

// Organization -> Owner
Organization.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Organization, { foreignKey: 'ownerId', as: 'ownedOrganizations' });

// Organization -> Transaction (for data isolation)
Organization.hasMany(Transaction, { foreignKey: 'organizationId', as: 'transactions' });
Organization.hasMany(Category, { foreignKey: 'organizationId', as: 'categories' });
Organization.hasMany(Budget, { foreignKey: 'organizationId', as: 'budgets' });
Organization.hasMany(Goal, { foreignKey: 'organizationId', as: 'goals' });
Organization.hasMany(Tag, { foreignKey: 'organizationId', as: 'tags' });
Organization.hasMany(RecurringRule, { foreignKey: 'organizationId', as: 'recurringRules' });

export { User, Transaction, Category, AuditLog, Tag, TransactionTag, Budget, Goal, RecurringRule, Organization, OrganizationMember };
