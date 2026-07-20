import { Prisma, User } from '@prisma/client';

export type UserWithRole = Prisma.UserGetPayload<{
  include: {
    role: { include: { permissions: { include: { permission: true } } } };
  };
}>;

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roleId: string;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  fullName?: string;
  roleId?: string;
  isActive?: boolean;
  priority?: number;
}

export const USERS_REPOSITORY = 'USERS_REPOSITORY';

export interface IUsersRepository {
  findByIdentifier(identifier: string): Promise<UserWithRole | null>;
  findById(id: string): Promise<UserWithRole | null>;
  findAll(): Promise<UserWithRole[]>;
  existsByUsernameOrEmail(username: string, email: string): Promise<boolean>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  remove(id: string): Promise<void>;
}
