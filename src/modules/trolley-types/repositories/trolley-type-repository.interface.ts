import { TrolleyType } from '@prisma/client';

export interface CreateTrolleyTypeData {
  name: string;
  isActive?: boolean;
}

export interface UpdateTrolleyTypeData {
  name?: string;
  isActive?: boolean;
}

export type TrolleyTypeSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllTrolleyTypesParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: TrolleyTypeSortBy;
  sortOrder: SortOrder;
}

export interface FindAllTrolleyTypesResult {
  items: TrolleyType[];
  total: number;
}

export const TROLLEY_TYPES_REPOSITORY = 'TROLLEY_TYPES_REPOSITORY';

export interface ITrolleyTypesRepository {
  findAll(
    params: FindAllTrolleyTypesParams,
  ): Promise<FindAllTrolleyTypesResult>;
  findById(id: string): Promise<TrolleyType | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  create(data: CreateTrolleyTypeData): Promise<TrolleyType>;
  update(id: string, data: UpdateTrolleyTypeData): Promise<TrolleyType>;
  softDelete(id: string): Promise<void>;
}
