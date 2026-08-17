import { Trolley, TrolleyStatus } from '@prisma/client';

export interface TrolleyWithRelations extends Trolley {
  category: { id: string; name: string } | null;
  modelCodeProcess: { id: string; name: string; fromSystem: string } | null;
}

export interface CreateTrolleyData {
  name: string;
  code: string;
  status?: TrolleyStatus;
  trolleyCategoryId?: string;
  droppingLocationCode?: string;
  modelCodeProcessId?: string;
}

export interface UpdateTrolleyData {
  name?: string;
  code?: string;
  status?: TrolleyStatus;
  trolleyCategoryId?: string;
  droppingLocationCode?: string;
  modelCodeProcessId?: string;
}

export type TrolleySortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllTrolleysParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: TrolleySortBy;
  sortOrder: SortOrder;
}

export interface FindAllTrolleysResult {
  items: TrolleyWithRelations[];
  total: number;
}

export const TROLLEYS_REPOSITORY = 'TROLLEYS_REPOSITORY';

export interface ITrolleysRepository {
  findAll(params: FindAllTrolleysParams): Promise<FindAllTrolleysResult>;
  findById(id: string): Promise<TrolleyWithRelations | null>;
  findActiveByCode(code: string): Promise<TrolleyWithRelations | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
  existsActiveTrolleyCategoryById(id: string): Promise<boolean>;
  existsActiveModelCodeProcessById(id: string): Promise<boolean>;
  create(data: CreateTrolleyData): Promise<Trolley>;
  update(id: string, data: UpdateTrolleyData): Promise<Trolley>;
  softDelete(id: string): Promise<void>;
}
