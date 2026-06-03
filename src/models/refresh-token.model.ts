import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import type { RefreshTokenInterface, RefreshTokenCreation } from '../types/auth.types.js';

class RefreshToken
  extends Model<Omit<RefreshTokenInterface, 'createdAt' | 'updatedAt' | 'deletedAt'>, RefreshTokenCreation>
  implements RefreshTokenInterface
{
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare familyId: string;
  declare expiresAt: Date;
  declare usedAt: Date | null;
  declare revokedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'token_hash',
    },
    familyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'family_id',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'used_at',
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at',
    },

  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    paranoid: true,
    timestamps: true,
    underscored: true,
  },
);

export default RefreshToken;
