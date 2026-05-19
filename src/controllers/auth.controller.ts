import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';

export const AuthController = {
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password || name.trim() === '' || email.trim() === '') {
        res.status(400).json({ error: 'Name, email, and password are required fields.' });
        return;
      }

      const user = await AuthService.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: errorMessage });
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password || email.trim() === '') {
        res.status(400).json({ error: 'Email and password are required fields.' });
        return;
      }

      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: errorMessage });
    }
  }
};