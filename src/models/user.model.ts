import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';
import type { UserInterface, UserCreation } from '../types/user.types.js';

class User extends Model<UserInterface, UserCreation> implements UserInterface {
  public id!: string;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: 'admin' | 'user' | 'company';
  public status!: 'active' | 'inactive' | 'suspended';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'company'),
      defaultValue: 'user',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

export default User;