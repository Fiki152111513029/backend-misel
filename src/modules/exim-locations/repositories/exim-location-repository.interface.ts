import { EximLocation } from '@prisma/client';

export interface CreateEximLocationData {
  name: string;
  iRaypleLocationCode: string;
  isActive?: boolean;
}

export interface UpdateEximLocationData {
  name?: string;
  iRaypleLocationCode?: string;
  isActive?: boolean;
}

export type EximLocationSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllEximLocationsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: EximLocationSortBy;
  sortOrder: SortOrder;
}

export interface FindAllEximLocationsResult {
  items: EximLocation[];
  total: number;
}

export const EXIM_LOCATIONS_REPOSITORY = 'EXIM_LOCATIONS_REPOSITORY';

export interface IEximLocationsRepository {
  findAll(
    params: FindAllEximLocationsParams,
  ): Promise<FindAllEximLocationsResult>;
  findById(id: string): Promise<EximLocation | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  hasActiveProductionLineAreas(id: string): Promise<boolean>;
  create(data: CreateEximLocationData): Promise<EximLocation>;
  update(id: string, data: UpdateEximLocationData): Promise<EximLocation>;
  softDelete(id: string): Promise<void>;
}
