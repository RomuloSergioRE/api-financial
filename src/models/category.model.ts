import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';
import type { CategoryInterface, CategoryCreation } from '../types/category.types.js';

class Category extends Model<CategoryInterface, CategoryCreation> implements CategoryInterface {
  public id!: number;
  public name!: string;
  public type!: 'income' | 'expense';
  public status!: 'active' | 'inactive';
  public userId!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'categories',
  }
);

export default Category;