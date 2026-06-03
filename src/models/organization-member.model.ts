import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import type { OrganizationMemberInterface, OrgMemberRole, OrgMemberStatus } from '../types/organization.types.js';

class OrganizationMember extends Model implements OrganizationMemberInterface {
  declare id: string;
  declare organizationId: string;
  declare userId: string;
  declare role: OrgMemberRole;
  declare status: OrgMemberStatus;
  declare invitedBy: string;
  declare readonly createdAt: Date;
}

OrganizationMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'organization_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    role: {
      type: DataTypes.ENUM('admin', 'finance', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer',
    },
    status: {
      type: DataTypes.ENUM('active', 'pending'),
      allowNull: false,
      defaultValue: 'pending',
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'invited_by',
    },
  },
  {
    sequelize,
    modelName: 'OrganizationMember',
    tableName: 'organization_members',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['organization_id'], name: 'org_members_org_id_idx' },
      { fields: ['user_id'], name: 'org_members_user_id_idx' },
    ],
  }
);

export default OrganizationMember;
