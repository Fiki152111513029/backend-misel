import { FromSystem, ModelCodeProcess } from '@prisma/client';

export interface CreateModelCodeProcessData {
  name: string;
  fromSystem: FromSystem;
  isActive?: boolean;
  statusComment1?: string;
  statusComment2?: string;
  statusComment3?: string;
  statusComment4?: string;
  statusComment5?: string;
  statusComment6?: string;
  statusComment7?: string;
  statusComment8?: string;
}

export interface UpdateModelCodeProcessData {
  name?: string;
  fromSystem?: FromSystem;
  isActive?: boolean;
  statusComment1?: string;
  statusComment2?: string;
  statusComment3?: string;
  statusComment4?: string;
  statusComment5?: string;
  statusComment6?: string;
  statusComment7?: string;
  statusComment8?: string;
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
