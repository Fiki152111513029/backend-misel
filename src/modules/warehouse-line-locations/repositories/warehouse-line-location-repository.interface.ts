import { WarehouseLineLocation } from '@prisma/client';

export interface CreateWarehouseLineLocationData {
  name: string;
  droppingLocationCode: string;
  pickingLocationCode: string;
  modelCodeProcessId?: string;
}

export interface UpdateWarehouseLineLocationData {
  name?: string;
  droppingLocationCode?: string;
  pickingLocationCode?: string;
  modelCodeProcessId?: string;
}

export interface ModelCodeProcessRefForLineLocation {
  id: string;
  name: string;
  fromSystem: string;
  isActive: boolean;
}

export interface WarehouseLineLocationWithRelations extends WarehouseLineLocation {
  modelCodeProcess: ModelCodeProcessRefForLineLocation | null;
}

export type WarehouseLineLocationSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllWarehouseLineLocationsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: WarehouseLineLocationSortBy;
  sortOrder: SortOrder;
}

export interface FindAllWarehouseLineLocationsResult {
  items: WarehouseLineLocationWithRelations[];
  total: number;
}

export const WAREHOUSE_LINE_LOCATIONS_REPOSITORY =
  'WAREHOUSE_LINE_LOCATIONS_REPOSITORY';

export interface IWarehouseLineLocationsRepository {
  findAll(
    params: FindAllWarehouseLineLocationsParams,
  ): Promise<FindAllWarehouseLineLocationsResult>;
  findById(id: string): Promise<WarehouseLineLocationWithRelations | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByDroppingLocationCode(
    code: string,
    excludeId?: string,
  ): Promise<boolean>;
  existsByPickingLocationCode(
    code: string,
    excludeId?: string,
  ): Promise<boolean>;
  create(data: CreateWarehouseLineLocationData): Promise<WarehouseLineLocation>;
  update(
    id: string,
    data: UpdateWarehouseLineLocationData,
  ): Promise<WarehouseLineLocation>;
  softDelete(id: string): Promise<void>;
}
