type Role = 'admin' | 'user' | 'company';
type Status = 'active' | 'inactive' | 'suspended';
type Creation = 'id' | 'role'| 'status' | 'createdAt' | 'updatedAt';

export interface UserInterface{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role:  Role;
    status: Status;
    createdAt?: Date;
    updatedAt?: Date;
}

export type UserCreation = Omit<UserInterface, Creation> & {
    id?: string;
    role?: Role;
    status?: Status;
}