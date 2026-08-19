import { ProductionLocation } from '@prisma/client';

export interface CreateProductionLocationData {
  name: string;
  iRaypleLocationCode: string;
  isActive?: boolean;
}

export interface UpdateProductionLocationData {
  name?: string;
  iRaypleLocationCode?: string;
  isActive?: boolean;
}

export type ProductionLocationSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllProductionLocationsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: ProductionLocationSortBy;
  sortOrder: SortOrder;
}

export interface FindAllProductionLocationsResult {
  items: ProductionLocation[];
  total: number;
}

export const PRODUCTION_LOCATIONS_REPOSITORY = 'PRODUCTION_LOCATIONS_REPOSITORY';

export interface IProductionLocationsRepository {
  findAll(
    params: FindAllProductionLocationsParams,
  ): Promise<FindAllProductionLocationsResult>;
  findById(id: string): Promise<ProductionLocation | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  existsActiveByLocationCode(code: string): Promise<boolean>;
  findActiveByLocationCode(code: string): Promise<ProductionLocation | null>;
  create(data: CreateProductionLocationData): Promise<ProductionLocation>;
  update(
    id: string,
    data: UpdateProductionLocationData,
  ): Promise<ProductionLocation>;
  softDelete(id: string): Promise<void>;
}
