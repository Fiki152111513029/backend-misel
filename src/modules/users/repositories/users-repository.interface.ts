import { Prisma, User } from '@prisma/client';

export type UserWithRole = Prisma.UserGetPayload<{
  include: {
    role: { include: { permissions: { include: { permission: true } } } };
  };
}>;

export interface CreateUserData {
  username: string;
  email?: string;
  password: string;
  fullName: string;
  roleId: string;
  shiftId?: string | null;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateUserData {
  username?: string;
  email?: string | null;
  password?: string;
  fullName?: string;
  roleId?: string;
  shiftId?: string | null;
  isActive?: boolean;
  priority?: number;
}

export const USERS_REPOSITORY = 'USERS_REPOSITORY';

export interface IUsersRepository {
  findByIdentifier(identifier: string): Promise<UserWithRole | null>;
  findById(id: string): Promise<UserWithRole | null>;
  findAll(): Promise<UserWithRole[]>;
  existsByUsernameOrEmail(username: string, email?: string): Promise<boolean>;
  existsByEmail(email: string, excludeId?: string): Promise<boolean>;
  existsByUsername(username: string, excludeId?: string): Promise<boolean>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  remove(id: string): Promise<void>;
  // Explicit online/offline flag, flipped by LoginUseCase/LogoutUseCase —
  // never exposed on CreateUserDto/UpdateUserDto, since it reflects actual
  // login/logout events, not something an admin should hand-edit.
  setOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  // Powers the Trolley Activity dashboard's "Active Operators" stat —
  // `online` counts Warehouse/Operator role users currently flagged
  // isOnline; `total` is every such user regardless of online status, so
  // the stat can read as "X / Y online" rather than just X.
  getOperatorOnlineCounts(): Promise<{ online: number; total: number }>;
}
