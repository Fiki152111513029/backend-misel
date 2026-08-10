import { FactoryMap } from '@prisma/client';

export interface CreateFactoryMapData {
  name: string;
  areaNumber: number;
  imagePath?: string;
  topologyPath: string;
}

export interface UpdateFactoryMapData {
  name?: string;
  areaNumber?: number;
  imagePath?: string;
  topologyPath?: string;
}

export type FactoryMapSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllFactoryMapsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: FactoryMapSortBy;
  sortOrder: SortOrder;
}

export interface FindAllFactoryMapsResult {
  items: FactoryMap[];
  total: number;
}

export const FACTORY_MAPS_REPOSITORY = 'FACTORY_MAPS_REPOSITORY';

export interface IFactoryMapsRepository {
  findAll(params: FindAllFactoryMapsParams): Promise<FindAllFactoryMapsResult>;
  findById(id: string): Promise<FactoryMap | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByAreaNumber(areaNumber: number, excludeId?: string): Promise<boolean>;
  create(data: CreateFactoryMapData): Promise<FactoryMap>;
  update(id: string, data: UpdateFactoryMapData): Promise<FactoryMap>;
  softDelete(id: string): Promise<void>;
}
