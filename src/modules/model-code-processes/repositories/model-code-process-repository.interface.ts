import { FromSystem, ModelCodeProcess } from '@prisma/client';

export interface CreateModelCodeProcessData {
  name: string;
  fromSystem: FromSystem;
  isActive?: boolean;
}

export interface UpdateModelCodeProcessData {
  name?: string;
  fromSystem?: FromSystem;
  isActive?: boolean;
}

export type ModelCodeProcessSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllModelCodeProcessesParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: ModelCodeProcessSortBy;
  sortOrder: SortOrder;
}

export interface FindAllModelCodeProcessesResult {
  items: ModelCodeProcess[];
  total: number;
}

export const MODEL_CODE_PROCESSES_REPOSITORY = 'MODEL_CODE_PROCESSES_REPOSITORY';

export interface IModelCodeProcessesRepository {
  findAll(
    params: FindAllModelCodeProcessesParams,
  ): Promise<FindAllModelCodeProcessesResult>;
  findById(id: string): Promise<ModelCodeProcess | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  create(data: CreateModelCodeProcessData): Promise<ModelCodeProcess>;
  update(
    id: string,
    data: UpdateModelCodeProcessData,
  ): Promise<ModelCodeProcess>;
  softDelete(id: string): Promise<void>;
}
