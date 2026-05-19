import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const expiresSetting = process.env.JWT_EXPIRES_IN || '1d';

interface TokenPayload {
  userId: string;
  role: 'admin' | 'user' | 'company';
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