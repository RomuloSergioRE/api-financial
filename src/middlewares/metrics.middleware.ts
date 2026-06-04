import type { Request, Response, NextFunction } from 'express';

let requestCount = 0;
let errorCount = 0;

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  requestCount++;
  res.on('finish', () => {
    if (res.statusCode >= 500) errorCount++;
  });
  next();
}

export function getMetrics(): { requestCount: number; errorCount: number } {
  const result = { requestCount, errorCount };
  requestCount = 0;
  errorCount = 0;
  return result;
}
