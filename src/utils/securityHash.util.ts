import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const SecurityHash = {
  hashPassword: async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  comparePassword: async (password: string, encryptedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, encryptedPassword);
  }
};