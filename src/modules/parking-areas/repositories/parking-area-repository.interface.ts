import { ParkingArea } from '@prisma/client';

export interface CreateParkingAreaData {
  name: string;
  iRaypleLocationCode: string;
  isActive?: boolean;
}

export interface UpdateParkingAreaData {
  name?: string;
  iRaypleLocationCode?: string;
  isActive?: boolean;
}

export type ParkingAreaSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllParkingAreasParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: ParkingAreaSortBy;
  sortOrder: SortOrder;
}

export interface FindAllParkingAreasResult {
  items: ParkingArea[];
  total: number;
}

export const PARKING_AREAS_REPOSITORY = 'PARKING_AREAS_REPOSITORY';

export interface IParkingAreasRepository {
  findAll(
    params: FindAllParkingAreasParams,
  ): Promise<FindAllParkingAreasResult>;
  findById(id: string): Promise<ParkingArea | null>;
  findAllActiveCodes(): Promise<string[]>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  create(data: CreateParkingAreaData): Promise<ParkingArea>;
  update(id: string, data: UpdateParkingAreaData): Promise<ParkingArea>;
  softDelete(id: string): Promise<void>;
}
