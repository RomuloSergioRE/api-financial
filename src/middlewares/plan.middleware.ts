import type { Request, Response, NextFunction } from 'express';
import { BusinessError } from '../utils/errors.js';

const TIER: Record<'free' | 'pro' | 'enterprise', number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export function requirePlan(requiredPlan: 'free' | 'pro' | 'enterprise') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userPlan = req.user?.plan;

    if (!userPlan) {
      next(new BusinessError('Usuário não autenticado', 401));
      return;
    }

    if (TIER[userPlan] < TIER[requiredPlan]) {
      next(new BusinessError('PLAN_UPGRADE_REQUIRED', 403));
      return;
    }

    next();
  };
}
