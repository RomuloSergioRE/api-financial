import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; 
import type { UserInterface, UserCreation } from '../types/user.types.js';

class User extends Model<Omit<UserInterface, 'createdAt' | 'updatedAt'>, UserCreation> implements UserInterface {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: 'admin' | 'user' | 'company';
  declare status: 'active' | 'inactive' | 'suspended';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
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
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'company'),
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);

export default User;