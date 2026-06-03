import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import type { OrganizationInterface } from '../types/organization.types.js';

class Organization extends Model implements OrganizationInterface {
  declare id: string;
  declare name: string;
  declare ownerId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_id',
    },
  },
  {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
    timestamps: true,
    updatedAt: true,
  }
);

export default Organization;
