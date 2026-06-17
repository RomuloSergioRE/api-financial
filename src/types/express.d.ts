declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'admin' | 'user' | 'company';
        plan: 'free' | 'pro' | 'enterprise';
        organizationId?: string;
      };
      validated?: unknown;
    }
  }
}

export {};
