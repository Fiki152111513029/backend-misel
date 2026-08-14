import { TrolleyCategory } from '@prisma/client';

export interface CreateTrolleyCategoryData {
  name: string;
}

export interface UpdateTrolleyCategoryData {
  name?: string;
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
  items: TrolleyCategory[];
  total: number;
}

export const TROLLEY_CATEGORIES_REPOSITORY = 'TROLLEY_CATEGORIES_REPOSITORY';

export interface ITrolleyCategoriesRepository {
  findAll(
    params: FindAllTrolleyCategoriesParams,
  ): Promise<FindAllTrolleyCategoriesResult>;
  findById(id: string): Promise<TrolleyCategory | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  create(data: CreateTrolleyCategoryData): Promise<TrolleyCategory>;
  update(id: string, data: UpdateTrolleyCategoryData): Promise<TrolleyCategory>;
  softDelete(id: string): Promise<void>;
}
