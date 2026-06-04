import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';

export const AuthController = {
  register: async (req: Request, res: Response): Promise<void> => {
    const user = await AuthService.register(req.body);
    res.status(201).json(user);
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await AuthService.login(email, password);
    res.status(200).json(result);
  },

  me: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const user = await AuthService.getProfile(userId);
    res.status(200).json(user);
  },

  updateProfile: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const user = await AuthService.updateProfile(userId, req.body);
    res.status(200).json(user);
  },

  updatePassword: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await AuthService.updatePassword(userId, currentPassword, newPassword);
    res.status(200).json({ message: 'Password updated successfully' });
  },

  refresh: async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await AuthService.refreshToken(refreshToken);
    res.status(200).json(result);
  },

  logout: async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken: string };
    const userId = req.user!.id;
    await AuthService.logout(refreshToken, userId);
    res.status(204).send();
  },
};
