import { EmptyPalletLocation } from '@prisma/client';

export interface CreateEmptyPalletLocationData {
  name: string;
  iRaypleLocationCode: string;
  isActive?: boolean;
}

export interface UpdateEmptyPalletLocationData {
  name?: string;
  iRaypleLocationCode?: string;
  isActive?: boolean;
}

export type EmptyPalletLocationSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllEmptyPalletLocationsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: EmptyPalletLocationSortBy;
  sortOrder: SortOrder;
}

export interface FindAllEmptyPalletLocationsResult {
  items: EmptyPalletLocation[];
  total: number;
}

export const EMPTY_PALLET_LOCATIONS_REPOSITORY =
  'EMPTY_PALLET_LOCATIONS_REPOSITORY';

export interface IEmptyPalletLocationsRepository {
  findAll(
    params: FindAllEmptyPalletLocationsParams,
  ): Promise<FindAllEmptyPalletLocationsResult>;
  findById(id: string): Promise<EmptyPalletLocation | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  hasActiveProductionLineAreas(id: string): Promise<boolean>;
  create(data: CreateEmptyPalletLocationData): Promise<EmptyPalletLocation>;
  update(
    id: string,
    data: UpdateEmptyPalletLocationData,
  ): Promise<EmptyPalletLocation>;
  softDelete(id: string): Promise<void>;
}
