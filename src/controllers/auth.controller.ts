import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import type { UserUpdateInput } from '../types/user.types.js';
import { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema, refreshSchema, logoutSchema } from '../validators/auth.validator.js';
import { handleControllerError } from '../utils/errors.js';

export const AuthController = {
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const validated = registerSchema.parse(req.body);
      const user = await AuthService.register(validated);
      res.status(201).json(user);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  me: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getProfile(userId);
      res.status(200).json(user);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  updateProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validated = updateProfileSchema.parse(req.body);
      const user = await AuthService.updateProfile(userId, validated as UserUpdateInput);
      res.status(200).json(user);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  updatePassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
      await AuthService.updatePassword(userId, currentPassword, newPassword);
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  refresh: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const result = await AuthService.refreshToken(refreshToken);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  logout: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = logoutSchema.parse(req.body);
      const userId = req.user!.id;
      await AuthService.logout(refreshToken, userId);
      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error);
    }
  },
};
