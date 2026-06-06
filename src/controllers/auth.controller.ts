import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { AuthService } from '../services/auth.service.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, path: '/api/auth' });
}

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.register(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await AuthService.login(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json(result);
  }),

  me: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const user = await AuthService.getProfile(userId);
    res.status(200).json(user);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const user = await AuthService.updateProfile(userId, req.body);
    res.status(200).json(user);
  }),

  updatePassword: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await AuthService.updatePassword(userId, currentPassword, newPassword);
    res.status(200).json({ message: 'Password updated successfully' });
  }),

  refresh: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token not found' });
      return;
    }
    const result = await AuthService.refreshToken(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json(result);
  }),

  logout: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId = req.user!.id;
    if (refreshToken) {
      await AuthService.logout(refreshToken, userId);
    }
    clearAuthCookies(res);
    res.status(204).send();
  }),
};
