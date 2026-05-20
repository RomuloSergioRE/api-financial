import { UserRepository } from '../repositories/user.repository.js';
import { JwtUtil } from '../utils/jwt.util.js';
import type { UserCreation, UserInterface } from '../types/user.types.js';
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
            if (userExists.deletedAt) {
                throw new Error('This account was deleted. Please contact support to reactivate it.');
            }
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
        });

        return {
            user: mapToUserDTO(user),
            token,
        };
    }
};