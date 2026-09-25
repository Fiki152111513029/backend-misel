import { ControlTask, ModelCodeProcess } from '@prisma/client';

export type ControlTaskWithRelations = ControlTask & {
  modelCodeProcess: Pick<
    ModelCodeProcess,
    'id' | 'name' | 'fromSystem' | 'isActive'
  > | null;
};

export interface CreateControlTaskData {
  abjad: string;
  name: string;
  modelCodeProcessId: string;
  route: string[];
  isActive?: boolean;
}

export interface UpdateControlTaskData {
  abjad?: string;
  name?: string;
  modelCodeProcessId?: string;
  route?: string[];
  isActive?: boolean;
}

export type ControlTaskSortBy = 'abjad' | 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllControlTasksParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: ControlTaskSortBy;
  sortOrder: SortOrder;
}

export interface FindAllControlTasksResult {
  items: ControlTaskWithRelations[];
  total: number;
}

// A single leg the user can pick when building a route. `source` is only
// there so the picker can group/label them — once chosen, a leg is just its
// location code, and the two tables are interchangeable.
export interface RouteOption {
  name: string;
  iRaypleLocationCode: string;
  source: 'PRODUCTION' | 'WAREHOUSE';
}

export const CONTROL_TASKS_REPOSITORY = 'CONTROL_TASKS_REPOSITORY';

export interface IControlTasksRepository {
  findAll(
    params: FindAllControlTasksParams,
  ): Promise<FindAllControlTasksResult>;
  findById(id: string): Promise<ControlTaskWithRelations | null>;
  findByAbjad(abjad: string): Promise<ControlTaskWithRelations | null>;
  existsByAbjad(abjad: string, excludeId?: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  modelCodeProcessExists(id: string): Promise<boolean>;
  findRouteOptions(): Promise<RouteOption[]>;
  create(data: CreateControlTaskData): Promise<ControlTaskWithRelations>;
  update(
    id: string,
    data: UpdateControlTaskData,
  ): Promise<ControlTaskWithRelations>;
  softDelete(id: string): Promise<void>;
}
