import { BoxType, FromSystem } from '@prisma/client';

export interface CreateBoxTypeData {
  name: string;
  ordering: number;
  colorCode: string;
  modelProcessCode: string;
  fromSystem: FromSystem;
}

export interface UpdateBoxTypeData {
  name?: string;
  ordering?: number;
  colorCode?: string;
  modelProcessCode?: string;
  fromSystem?: FromSystem;
}

export type BoxTypeSortBy = 'name' | 'ordering' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllBoxTypesParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: BoxTypeSortBy;
  sortOrder: SortOrder;
}

export interface FindAllBoxTypesResult {
  items: BoxType[];
  total: number;
}

export const BOX_TYPES_REPOSITORY = 'BOX_TYPES_REPOSITORY';

export interface IBoxTypesRepository {
  findAll(params: FindAllBoxTypesParams): Promise<FindAllBoxTypesResult>;
  findById(id: string): Promise<BoxType | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByOrdering(ordering: number, excludeId?: string): Promise<boolean>;
  hasActiveRequestBoxes(id: string): Promise<boolean>;
  create(data: CreateBoxTypeData): Promise<BoxType>;
  update(id: string, data: UpdateBoxTypeData): Promise<BoxType>;
  softDelete(id: string): Promise<void>;
}
