import type { Response } from 'express';
import { z } from 'zod';
import { logger, getRequestId } from './logger.js';

export class BusinessError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
  }
}

export function handleControllerError(res: Response, error: unknown): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: 'Validation Error', details: error.issues });
    return;
  }
  if (error instanceof BusinessError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  const requestId = getRequestId();
  logger.error('Unhandled controller error', error);
  res.status(500).json({ error: 'Internal Server Error', requestId });
}
