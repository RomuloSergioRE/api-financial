import { rateLimit } from 'express-rate-limit';

export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many export requests. Please try again in 15 minutes.' },
});
