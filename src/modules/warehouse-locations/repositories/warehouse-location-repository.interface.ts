import { WarehouseLocation } from '@prisma/client';

export interface CreateWarehouseLocationData {
  name: string;
  iRaypleLocationCode: string;
  isActive?: boolean;
}

export interface UpdateWarehouseLocationData {
  name?: string;
  iRaypleLocationCode?: string;
  isActive?: boolean;
}

export type WarehouseLocationSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllWarehouseLocationsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: WarehouseLocationSortBy;
  sortOrder: SortOrder;
}

export interface FindAllWarehouseLocationsResult {
  items: WarehouseLocation[];
  total: number;
}

export const WAREHOUSE_LOCATIONS_REPOSITORY = 'WAREHOUSE_LOCATIONS_REPOSITORY';

export interface IWarehouseLocationsRepository {
  findAll(
    params: FindAllWarehouseLocationsParams,
  ): Promise<FindAllWarehouseLocationsResult>;
  findById(id: string): Promise<WarehouseLocation | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  existsActiveByLocationCode(code: string): Promise<boolean>;
  create(data: CreateWarehouseLocationData): Promise<WarehouseLocation>;
  update(
    id: string,
    data: UpdateWarehouseLocationData,
  ): Promise<WarehouseLocation>;
  softDelete(id: string): Promise<void>;
}
