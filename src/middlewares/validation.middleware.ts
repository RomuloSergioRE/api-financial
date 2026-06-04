import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validate(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({ error: 'Validation Error', details: result.error.issues });
      return;
    }
    if (source === 'body') {
      req.body = result.data;
    } else {
      req.validated = result.data;
    }
    next();
  };
}
