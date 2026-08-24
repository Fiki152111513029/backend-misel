import { TrolleyCategory } from '@prisma/client';

export interface TrolleyCategoryWithRelations extends TrolleyCategory {
  modelCodeProcess: { id: string; name: string; fromSystem: string } | null;
}

export interface CreateTrolleyCategoryData {
  name: string;
  modelCodeProcessId?: string;
}

export interface UpdateTrolleyCategoryData {
  name?: string;
  modelCodeProcessId?: string;
}

export type TrolleyCategorySortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllTrolleyCategoriesParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: TrolleyCategorySortBy;
  sortOrder: SortOrder;
}

export interface FindAllTrolleyCategoriesResult {
  items: TrolleyCategoryWithRelations[];
  total: number;
}

export const TROLLEY_CATEGORIES_REPOSITORY = 'TROLLEY_CATEGORIES_REPOSITORY';

export interface ITrolleyCategoriesRepository {
  findAll(
    params: FindAllTrolleyCategoriesParams,
  ): Promise<FindAllTrolleyCategoriesResult>;
  findById(id: string): Promise<TrolleyCategoryWithRelations | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsActiveModelCodeProcessById(id: string): Promise<boolean>;
  create(data: CreateTrolleyCategoryData): Promise<TrolleyCategoryWithRelations>;
  update(
    id: string,
    data: UpdateTrolleyCategoryData,
  ): Promise<TrolleyCategoryWithRelations>;
  softDelete(id: string): Promise<void>;
}
