import { Rack, RackStatus } from '@prisma/client';

export interface CreateRackData {
  name: string;
  status?: RackStatus;
  isActive?: boolean;
}

export interface UpdateRackData {
  name?: string;
  status?: RackStatus;
  isActive?: boolean;
}

export type RackSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllRacksParams {
  page: number;
  limit: number;
  search?: string;
  status?: RackStatus;
  sortBy: RackSortBy;
  sortOrder: SortOrder;
}

export interface FindAllRacksResult {
  items: Rack[];
  total: number;
}

export const RACKS_REPOSITORY = 'RACKS_REPOSITORY';

export interface IRacksRepository {
  findAll(params: FindAllRacksParams): Promise<FindAllRacksResult>;
  findById(id: string): Promise<Rack | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  create(data: CreateRackData): Promise<Rack>;
  update(id: string, data: UpdateRackData): Promise<Rack>;
  softDelete(id: string): Promise<void>;
}
