import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET environment variable is required'); })();
const expiresSetting = process.env.JWT_EXPIRES_IN || '1d';

interface TokenPayload {
  userId: string;
  role: 'admin' | 'user' | 'company';
  status: string;
  tokenVersion: number;
  organizationId?: string;
}

type StrictSignOptions = Omit<jwt.SignOptions, 'expiresIn'> & {
  expiresIn: string | number;
};

function createToken(payload: TokenPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: expiresSetting } as jwt.SignOptions);
}

export const JwtUtil = {
  generateToken: (payload: TokenPayload): string => {
    return createToken(payload);
  },

  generateTokenWithOrg: (userId: string, role: string, organizationId: string): string => {
    return createToken({
      userId,
      role: role as 'admin' | 'user' | 'company',
      status: 'active',
      tokenVersion: 0,
      organizationId,
    });
  },

  generateTokenWithoutOrg: (userId: string, role: string): string => {
    return createToken({
      userId,
      role: role as 'admin' | 'user' | 'company',
      status: 'active',
      tokenVersion: 0,
    });
  },

  verifyToken: (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }
};
