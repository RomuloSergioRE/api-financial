declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'admin' | 'user' | 'company';
        organizationId?: string;
      };
      validated?: unknown;
    }
  }
}

export {};
