import { ChargerArea } from '@prisma/client';

export interface CreateChargerAreaData {
  name: string;
  iRaypleLocationCode: string;
  isActive?: boolean;
}

export interface UpdateChargerAreaData {
  name?: string;
  iRaypleLocationCode?: string;
  isActive?: boolean;
}

export type ChargerAreaSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllChargerAreasParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: ChargerAreaSortBy;
  sortOrder: SortOrder;
}

export interface FindAllChargerAreasResult {
  items: ChargerArea[];
  total: number;
}

export const CHARGER_AREAS_REPOSITORY = 'CHARGER_AREAS_REPOSITORY';

export interface IChargerAreasRepository {
  findAll(params: FindAllChargerAreasParams): Promise<FindAllChargerAreasResult>;
  findById(id: string): Promise<ChargerArea | null>;
  findAllActiveCodes(): Promise<string[]>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  create(data: CreateChargerAreaData): Promise<ChargerArea>;
  update(id: string, data: UpdateChargerAreaData): Promise<ChargerArea>;
  softDelete(id: string): Promise<void>;
}
