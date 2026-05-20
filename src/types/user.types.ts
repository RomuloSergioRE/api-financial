type Role = 'admin' | 'user' | 'company';
type Status = 'active' | 'inactive' | 'suspended';
type SequelizeTimestamps = 'createdAt' | 'updatedAt' | 'deletedAt'
type Creation = 'id' | 'role' | 'status' | SequelizeTimestamps;

export interface UserInterface {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export type UserCreation = Omit<UserInterface, Creation> & {
    id?: string;
    role?: Role;
    status?: Status;
}

export type UserUpdateInput = Partial<Omit<UserInterface, 'id' | SequelizeTimestamps>> & {
    status?: Status;
};