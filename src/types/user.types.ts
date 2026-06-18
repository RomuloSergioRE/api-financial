export type Role = 'admin' | 'user' | 'company';
export type Status = 'active' | 'inactive' | 'suspended';
export type Plan = 'free' | 'pro' | 'enterprise';
type SequelizeTimestamps = 'createdAt' | 'updatedAt' | 'deletedAt'
type Creation = 'id' | 'role' | 'status' | 'tokenVersion' | 'plan' | 'currency' | 'locale' | SequelizeTimestamps;

export interface UserInterface {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    status: Status;
    tokenVersion: number;
    plan: Plan;
    currency: string;
    locale: string;
    avatarUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export type UserCreation = Omit<UserInterface, Creation> & {
    id?: string;
    role?: Role;
    status?: Status;
    tokenVersion?: number;
    plan?: Plan;
    currency?: string;
    locale?: string;
}

export type UserProfileUpdate = Partial<Omit<UserInterface, 'id' | 'password' | 'tokenVersion' | SequelizeTimestamps>>;

export type UserUpdateInput = UserProfileUpdate & {
    status?: Status;
    password?: string;
    tokenVersion?: number;
};