import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; 
import type { UserInterface, UserCreation } from '../types/user.types.js';

type Role = 'admin' | 'user' | 'company';
type Status = 'active' | 'inactive' | 'suspended';
type SequelizeTimestamps = 'createdAt' | 'updatedAt' | 'deletedAt';

class User extends Model<Omit<UserInterface, SequelizeTimestamps>, UserCreation> implements UserInterface {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: Role;
  declare status: Status;
  declare tokenVersion: number;
  declare avatarUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null; 
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
    tokenVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
        name: 'users_email_unique_idx'
      },
      {
        fields: ['role'],
        name: 'users_role_idx'
      },
      {
        fields: ['status'],
        name: 'users_status_idx'
      }
    ]
  }
);

export default User;