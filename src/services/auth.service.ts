import crypto from 'node:crypto';
import { UserRepository } from '../repositories/user.repository.js';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository.js';
import { JwtUtil } from '../utils/jwt.util.js';
import type { UserCreation, UserInterface, UserUpdateInput } from '../types/user.types.js';
import { SecurityHash } from '../utils/securityHash.util.js';
import { BusinessError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

type UserDTO = Omit<UserInterface, 'password' | 'tokenVersion' | 'deletedAt'>;

const mapToUserDTO = (user: UserInterface): UserDTO => {
  const { password, tokenVersion, deletedAt, ...userDto } = user;
  return userDto;
};

export const AuthService = {
  register: async (userData: UserCreation): Promise<{ user: UserDTO; accessToken: string; refreshToken: string }> => {
    try {
      const { email, password, name, role } = userData;

      const userExists = await UserRepository.findByEmailWithDeleted(email);

      if (userExists) {
        throw new BusinessError('Registration failed', 400);
      }

      const hashedPassword = await SecurityHash.hashPassword(password);

      const newUser = await UserRepository.create({
        name,
        email,
        password: hashedPassword,
        ...(role && { role }),
      });

      const accessToken = JwtUtil.createAccessToken({
        userId: newUser.id,
        role: newUser.role,
        status: newUser.status,
        tokenVersion: newUser.tokenVersion,
        plan: newUser.plan,
      });

      const familyId = crypto.randomUUID();
      const refreshTokenString = JwtUtil.createRefreshTokenString();
      const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');
      const expiresAt = JwtUtil.getRefreshExpiresAt();

      await RefreshTokenRepository.create({
        userId: newUser.id,
        tokenHash,
        familyId,
        expiresAt,
      });

      return {
        user: mapToUserDTO(newUser),
        accessToken,
        refreshToken: refreshTokenString,
      };
    } catch (error) {
      logger.error('Register failed', { error, email: userData.email });
      throw error;
    }
  },

  login: async (email: string, password: string): Promise<{ user: UserDTO; accessToken: string; refreshToken: string }> => {
    const user = await UserRepository.findByEmail(email);

    if (!user || !user.password) {
      throw new BusinessError('Invalid email or password', 401);
    }

    const isPasswordValid = await SecurityHash.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BusinessError('Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      throw new BusinessError('Account is inactive or suspended.', 401);
    }

    await RefreshTokenRepository.deleteByUserId(user.id);

    const accessToken = JwtUtil.createAccessToken({
      userId: user.id,
      role: user.role,
      status: user.status,
      tokenVersion: user.tokenVersion,
      plan: user.plan,
    });

    const familyId = crypto.randomUUID();
    const refreshTokenString = JwtUtil.createRefreshTokenString();
    const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');
    const expiresAt = JwtUtil.getRefreshExpiresAt();

    await RefreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    });

    return {
      user: mapToUserDTO(user),
      accessToken,
      refreshToken: refreshTokenString,
    };
  },

  refreshToken: async (tokenStr: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const tokenHash = crypto.createHash('sha256').update(tokenStr).digest('hex');
    const stored = await RefreshTokenRepository.findByHash(tokenHash);

    if (!stored) {
      throw new BusinessError('Invalid refresh token', 401);
    }

    if (stored.usedAt) {
      await RefreshTokenRepository.deleteByFamilyId(stored.familyId);
      throw new BusinessError('Refresh token reused. All tokens in this family have been revoked.', 401);
    }

    if (stored.revokedAt) {
      throw new BusinessError('Refresh token revoked', 401);
    }

    if (new Date(stored.expiresAt) < new Date()) {
      await RefreshTokenRepository.deleteByTokenId(stored.id);
      throw new BusinessError('Refresh token expired', 401);
    }

    await RefreshTokenRepository.markUsed(stored.id);

    const user = await UserRepository.findById(stored.userId);
    if (!user || user.status !== 'active') {
      throw new BusinessError('User not found or inactive', 401);
    }

    const newAccessToken = JwtUtil.createAccessToken({
      userId: user.id,
      role: user.role,
      status: user.status,
      tokenVersion: user.tokenVersion,
      plan: user.plan,
    });

    const newRefreshTokenString = JwtUtil.createRefreshTokenString();
    const newHash = crypto.createHash('sha256').update(newRefreshTokenString).digest('hex');
    const newExpiresAt = JwtUtil.getRefreshExpiresAt();

    await RefreshTokenRepository.create({
      userId: user.id,
      tokenHash: newHash,
      familyId: stored.familyId,
      expiresAt: newExpiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenString,
    };
  },

  logout: async (tokenStr: string, userId: string): Promise<void> => {
    const tokenHash = crypto.createHash('sha256').update(tokenStr).digest('hex');
    const stored = await RefreshTokenRepository.findByHash(tokenHash);

    if (!stored || stored.userId !== userId) {
      return;
    }

    await RefreshTokenRepository.deleteByTokenId(stored.id);
  },

  getProfile: async (userId: string): Promise<UserDTO> => {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BusinessError('User not found', 404);
    }
    return mapToUserDTO(user);
  },

  updateProfile: async (userId: string, data: UserUpdateInput): Promise<UserDTO> => {
    const updated = await UserRepository.update(userId, data);
    if (!updated) {
      throw new BusinessError('User not found', 404);
    }
    return mapToUserDTO(updated);
  },

  updatePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    const user = await UserRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new BusinessError('User not found', 404);
    }

    const isPasswordValid = await SecurityHash.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BusinessError('Current password is incorrect', 400);
    }

    const hashedPassword = await SecurityHash.hashPassword(newPassword);
    await UserRepository.update(userId, { password: hashedPassword });

    await RefreshTokenRepository.deleteByUserId(userId);
  },
};
