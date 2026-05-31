import { UserRepository } from '../repositories/user.repository.js';
import { JwtUtil } from '../utils/jwt.util.js';
import type { UserCreation, UserInterface, UserUpdateInput } from '../types/user.types.js';
import { SecurityHash } from '../utils/securityHash.util.js';

type UserDTO = Omit<UserInterface, 'password' | 'deletedAt'>;

const mapToUserDTO = (user: UserInterface): UserDTO => {
  const { password, deletedAt, ...userDto } = user; 
  return userDto;
};

export const AuthService = {
    register: async (userData: UserCreation): Promise<UserDTO> => {
        const { email, password, name } = userData;

        const userExists = await UserRepository.findByEmailWithDeleted(email);
        
        if (userExists) {
            throw new Error('Email already registered');
        }

        const hashedPassword = await SecurityHash.hashPassword(password);

        const newUser = await UserRepository.create({
            name,
            email,
            password: hashedPassword,
        });

        return mapToUserDTO(newUser);
    },
    
    login: async (email: string, password: string): Promise<{ user: UserDTO; token: string }> => {
        const user = await UserRepository.findByEmail(email);
        
        if (!user || !user.password) {
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await SecurityHash.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        const token = JwtUtil.generateToken({
            userId: user.id,
            role: user.role,
            status: user.status,
        });

        return {
            user: mapToUserDTO(user),
            token,
        };
    },

    refreshToken: (token: string): string => {
        const decoded = JwtUtil.verifyToken(token);
        return JwtUtil.generateToken({
            userId: decoded.userId,
            role: decoded.role,
            status: decoded.status,
        });
    },

    getProfile: async (userId: string): Promise<UserDTO> => {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return mapToUserDTO(user);
    },

    updateProfile: async (userId: string, data: UserUpdateInput): Promise<UserDTO> => {
        const updated = await UserRepository.update(userId, data);
        if (!updated) {
            throw new Error('User not found');
        }
        return mapToUserDTO(updated);
    },

    updatePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await SecurityHash.comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        const hashedPassword = await SecurityHash.hashPassword(newPassword);
        await UserRepository.update(userId, { password: hashedPassword });
    }
};