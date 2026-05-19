import User from '../models/user.model.js';
import type { UserInterface, UserCreation } from '../types/user.types.js';

export const UserRepository = {
  create: async (userData: UserCreation): Promise<UserInterface> => {
    const newUser = await User.create(userData);
    return newUser.dataValues as UserInterface;
  },

  findByEmail: async (email: string): Promise<UserInterface | null> => {
    const user = await User.findOne({ where: { email } });
    return user ? (user.dataValues as UserInterface) : null;
  },

  findById: async (id: string): Promise<UserInterface | null> => {
    const user = await User.findByPk(id);
    return user ? (user.dataValues as UserInterface) : null;
  }
};