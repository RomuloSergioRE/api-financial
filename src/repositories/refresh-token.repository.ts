import { Op } from 'sequelize';
import RefreshToken from '../models/refresh-token.model.js';
import type { RefreshTokenInterface, RefreshTokenCreation } from '../types/auth.types.js';

export const RefreshTokenRepository = {
  async create(data: RefreshTokenCreation): Promise<RefreshTokenInterface> {
    const token = await RefreshToken.create(data);
    return token.toJSON() as RefreshTokenInterface;
  },

  async findByHash(tokenHash: string): Promise<RefreshTokenInterface | null> {
    const token = await RefreshToken.findOne({
      where: { tokenHash },
      paranoid: false,
    });
    return token ? (token.toJSON() as RefreshTokenInterface) : null;
  },

  async markUsed(id: string): Promise<void> {
    await RefreshToken.update(
      { usedAt: new Date() },
      { where: { id } },
    );
  },

  async deleteByUserId(userId: string): Promise<void> {
    await RefreshToken.destroy({ where: { userId }, force: true });
  },

  async deleteByTokenId(id: string): Promise<void> {
    await RefreshToken.destroy({ where: { id }, force: true });
  },

  async deleteByFamilyId(familyId: string): Promise<void> {
    await RefreshToken.destroy({ where: { familyId }, force: true });
  },

  async deleteExpired(): Promise<number> {
    const count = await RefreshToken.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
      force: true,
    });
    return count;
  },
};
