import type { Request, Response, NextFunction } from 'express';
import { generateRequestId, runWithRequestId } from '../utils/logger.js';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();
  res.setHeader('x-request-id', requestId);
  runWithRequestId(requestId, next);
}
