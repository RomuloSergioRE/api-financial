export interface RefreshTokenInterface {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type RefreshTokenCreation = Omit<RefreshTokenInterface, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'usedAt' | 'revokedAt'> & {
  id?: string;
  usedAt?: Date | null;
  revokedAt?: Date | null;
};

export interface TokenPayload {
  userId: string;
  role: 'admin' | 'user' | 'company';
  status: string;
  tokenVersion?: number;
  organizationId?: string;
}

export interface AuthLoginResponse {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

export interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
}
