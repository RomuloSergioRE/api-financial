import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

export interface AuditLogInterface {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  targetType: string;
  details: string | null;
  createdAt: Date;
}

class AuditLog extends Model<Omit<AuditLogInterface, 'createdAt'>, Omit<AuditLogInterface, 'id' | 'createdAt'>> implements AuditLogInterface {
  declare id: string;
  declare adminId: string;
  declare action: string;
  declare targetId: string;
  declare targetType: string;
  declare details: string | null;
  declare readonly createdAt: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['admin_id'], name: 'audit_logs_admin_id_idx' },
      { fields: ['target_id'], name: 'audit_logs_target_id_idx' },
    ],
  }
);

export default AuditLog;
