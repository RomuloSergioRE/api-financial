import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const expiresSetting = process.env.JWT_EXPIRES_IN || '1d';

interface TokenPayload {
  userId: string;
  role: 'admin' | 'user' | 'company';
  status: string;
}

type StrictSignOptions = Omit<jwt.SignOptions, 'expiresIn'> & {
  expiresIn: string | number;
};

export const JwtUtil = {
  generateToken: (payload: TokenPayload): string => {
    const options: StrictSignOptions = {
      expiresIn: expiresSetting,
    };
    return jwt.sign(payload, JWT_SECRET, options as jwt.SignOptions);
  },

  verifyToken: (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }
};