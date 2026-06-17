import type { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util.js';
import { UserRepository } from '../repositories/user.repository.js';
import { logger } from '../utils/logger.js';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [scheme, tokenValue] = authHeader.split(' ');
    if (scheme === 'Bearer' && tokenValue) {
      token = tokenValue;
    }
  }

  if (!token) {
    token = req.cookies?.accessToken;
  }

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = JwtUtil.verifyToken(token);

    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(401).json({ error: 'Account is inactive or suspended.' });
      return;
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      res.status(401).json({ error: 'Token revoked. Please log in again.' });
      return;
    }

    req.user = {
      id: user.id,
      role: user.role,
      plan: decoded.plan,
      ...(decoded.organizationId ? { organizationId: decoded.organizationId } : {}),
    };

    next();
  } catch (error) {
    logger.error('JWT verification failed', error);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
