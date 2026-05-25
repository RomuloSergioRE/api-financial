import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

export const AuthController = {
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const validated = registerSchema.parse(req.body);
      const user = await AuthService.register(validated);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.issues });
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: errorMessage });
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.issues });
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: errorMessage });
    }
  },

  refresh: async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'No token provided.' });
        return;
      }
      const [scheme, token] = authHeader.split(' ');
      if (scheme !== 'Bearer' || !token) {
        res.status(401).json({ error: 'Token malformatted.' });
        return;
      }
      const newToken = AuthService.refreshToken(token);
      res.status(200).json({ token: newToken });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid token';
      res.status(401).json({ error: errorMessage });
    }
  }
};