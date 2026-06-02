import { UserRepository } from '../repositories/user.repository.js';
import { JwtUtil } from '../utils/jwt.util.js';
import type { UserCreation, UserInterface, UserUpdateInput } from '../types/user.types.js';
import { SecurityHash } from '../utils/securityHash.util.js';
import { BusinessError } from '../utils/errors.js';

type UserDTO = Omit<UserInterface, 'password' | 'tokenVersion' | 'deletedAt'>;

const mapToUserDTO = (user: UserInterface): UserDTO => {
  const { password, tokenVersion, deletedAt, ...userDto } = user; 
  return userDto;
};

export const AuthService = {
    register: async (userData: UserCreation): Promise<UserDTO> => {
        const { email, password, name } = userData;

        const userExists = await UserRepository.findByEmailWithDeleted(email);
        
        if (userExists) {
            throw new BusinessError('Registration failed', 400);
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
            throw new BusinessError('Invalid email or password', 401);
        }

        const isPasswordValid = await SecurityHash.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new BusinessError('Invalid email or password', 401);
        }

        const token = JwtUtil.generateToken({
            userId: user.id,
            role: user.role,
            status: user.status,
            tokenVersion: user.tokenVersion,
        });

        return {
            user: mapToUserDTO(user),
            token,
        };
    },

    refreshToken: async (token: string): Promise<string> => {
        const decoded = JwtUtil.verifyToken(token);
        const user = await UserRepository.findById(decoded.userId);
        if (!user || user.status !== 'active') {
            throw new BusinessError('Invalid or expired token', 401);
        }
        if (user.tokenVersion !== decoded.tokenVersion) {
            throw new BusinessError('Token revoked. Please log in again.', 401);
        }
        return JwtUtil.generateToken({
            userId: user.id,
            role: user.role,
            status: user.status,
            tokenVersion: user.tokenVersion,
        });
    },

    getProfile: async (userId: string): Promise<UserDTO> => {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BusinessError('User not found', 404);
        }
        return mapToUserDTO(user);
    },

    updateProfile: async (userId: string, data: UserUpdateInput): Promise<UserDTO> => {
        const updated = await UserRepository.update(userId, data);
        if (!updated) {
            throw new BusinessError('User not found', 404);
        }
        return mapToUserDTO(updated);
    },

    updatePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
        const user = await UserRepository.findByIdWithPassword(userId);
        if (!user) {
            throw new BusinessError('User not found', 404);
        }

        const isPasswordValid = await SecurityHash.comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BusinessError('Current password is incorrect', 400);
        }

        const hashedPassword = await SecurityHash.hashPassword(newPassword);
        const nextVersion = user.tokenVersion + 1;
        await UserRepository.update(userId, { password: hashedPassword, tokenVersion: nextVersion });
    }
};