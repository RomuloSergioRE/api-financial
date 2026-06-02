export type Role = 'admin' | 'user' | 'company';
export type Status = 'active' | 'inactive' | 'suspended';
type SequelizeTimestamps = 'createdAt' | 'updatedAt' | 'deletedAt'
type Creation = 'id' | 'role' | 'status' | 'tokenVersion' | SequelizeTimestamps;

export interface UserInterface {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    status: Status;
    tokenVersion: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export type UserCreation = Omit<UserInterface, Creation> & {
    id?: string;
    role?: Role;
    status?: Status;
    tokenVersion?: number;
}

export type UserUpdateInput = Partial<Omit<UserInterface, 'id' | 'password' | SequelizeTimestamps>> & {
    status?: Status;
    password?: string;
};