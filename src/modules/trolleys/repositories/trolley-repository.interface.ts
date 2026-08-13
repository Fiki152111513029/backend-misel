import { Trolley, TrolleyStatus } from '@prisma/client';

export interface CreateTrolleyData {
  name: string;
  code: string;
  status?: TrolleyStatus;
}

export interface UpdateTrolleyData {
  name?: string;
  code?: string;
  status?: TrolleyStatus;
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
  items: Trolley[];
  total: number;
}

export const TROLLEYS_REPOSITORY = 'TROLLEYS_REPOSITORY';

export interface ITrolleysRepository {
  findAll(params: FindAllTrolleysParams): Promise<FindAllTrolleysResult>;
  findById(id: string): Promise<Trolley | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
  create(data: CreateTrolleyData): Promise<Trolley>;
  update(id: string, data: UpdateTrolleyData): Promise<Trolley>;
  softDelete(id: string): Promise<void>;
}
