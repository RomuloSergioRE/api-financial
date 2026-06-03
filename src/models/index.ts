import User from './user.model.js';
import Transaction from './transaction.model.js';
import Category from './category.model.js';
import AuditLog from './audit.model.js';
import Tag from './tag.model.js';
import TransactionTag from './transaction-tag.model.js';
import Budget from './budget.model.js';
import Goal from './goal.model.js';

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

export { User, Transaction, Category, AuditLog, Tag, TransactionTag, Budget, Goal };
