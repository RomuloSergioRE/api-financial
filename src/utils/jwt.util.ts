import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import type { TokenPayload } from '../types/auth.types.js';

const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET environment variable is required'); })();
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '7', 10);

function createAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

function createRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

function getRefreshExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_EXPIRES_DAYS);
  return date;
}

export const JwtUtil = {
  generateToken: (payload: TokenPayload): string => {
    return createAccessToken(payload);
  },

  generateTokenWithOrg: (userId: string, role: string, organizationId: string, tokenVersion: number, plan: string, currency: string): string => {
    return createAccessToken({
      userId,
      role: role as 'admin' | 'user' | 'company',
      status: 'active',
      tokenVersion,
      plan: plan as 'free' | 'pro' | 'enterprise',
      organizationId,
      currency,
    });
  },

  generateTokenWithoutOrg: (userId: string, role: string, tokenVersion: number, plan: string, currency: string): string => {
    return createAccessToken({
      userId,
      role: role as 'admin' | 'user' | 'company',
      status: 'active',
      tokenVersion,
      plan: plan as 'free' | 'pro' | 'enterprise',
      currency,
    });
  },

  createAccessToken,
  createRefreshTokenString,
  getRefreshExpiresAt,

  verifyToken: (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  },
};
