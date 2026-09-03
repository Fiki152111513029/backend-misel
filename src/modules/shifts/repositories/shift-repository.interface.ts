import { Shift } from '@prisma/client';

export interface CreateShiftData {
  name: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface UpdateShiftData {
  name?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export type ShiftSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllShiftsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: ShiftSortBy;
  sortOrder: SortOrder;
}

export interface FindAllShiftsResult {
  items: Shift[];
  total: number;
}

export const SHIFTS_REPOSITORY = 'SHIFTS_REPOSITORY';

export interface IShiftsRepository {
  findAll(params: FindAllShiftsParams): Promise<FindAllShiftsResult>;
  findById(id: string): Promise<Shift | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  create(data: CreateShiftData): Promise<Shift>;
  update(id: string, data: UpdateShiftData): Promise<Shift>;
  softDelete(id: string): Promise<void>;
}
