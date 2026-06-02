import { User } from '../models/index.js';
import type { UserInterface, UserCreation, UserUpdateInput } from '../types/user.types.js';

export const UserRepository = {
  create: async (userData: UserCreation): Promise<UserInterface> => {
    const newUser = await User.create(userData);
    return newUser.dataValues as UserInterface;
  },

  findByEmail: async (email: string): Promise<UserInterface | null> => {
    const user = await User.findOne({ where: { email } });
    return user ? (user.dataValues as UserInterface) : null;
  },

  findByEmailWithDeleted: async (email: string): Promise<UserInterface | null> => {
    const user = await User.findOne({ where: { email }, paranoid: false });
    return user ? (user.dataValues as UserInterface) : null;
  },

  findById: async (id: string): Promise<UserInterface | null> => {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    return user ? (user.dataValues as UserInterface) : null;
  },

  findByIdWithPassword: async (id: string): Promise<UserInterface | null> => {
    const user = await User.findByPk(id);
    return user ? (user.dataValues as UserInterface) : null;
  },
  
  update: async (id: string, updateData: UserUpdateInput): Promise<UserInterface | null> => {
    const [affectedCount, affectedRows] = await User.update(updateData, {
      where: { id },
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as UserInterface;
  },

  delete: async (id: string): Promise<boolean> => {
    const deletedRows = await User.destroy({ where: { id } });
    return deletedRows > 0;
  }
};