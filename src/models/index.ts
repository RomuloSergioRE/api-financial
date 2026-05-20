import User from './user.model.js';
import Transaction from './transaction.model.js';
import Category from './category.model.js';

// Relacionamento: User -> Transaction
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Relacionamento: User -> Category (Para categorias personalizadas)
User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Relacionamento: Category -> Transaction (O vínculo pedido!)
Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

export { User, Transaction, Category };