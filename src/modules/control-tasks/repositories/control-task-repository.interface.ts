import { ControlTask, ModelCodeProcess } from '@prisma/client';

export type ControlTaskWithRelations = ControlTask & {
  modelCodeProcess: Pick<
    ModelCodeProcess,
    'id' | 'name' | 'fromSystem' | 'isActive'
  > | null;
  /** Operators this task was registered to — who sees it in Custom Task. */
  assignees: { user: { id: string; username: string; fullName: string } }[];
};

export interface CreateControlTaskData {
  code: string;
  name: string;
  /** Heading in the Custom Task picker; null groups it under "Other". */
  groupName?: string | null;
  /** Button colour as #RRGGBB; null uses the page default. */
  colorCode?: string | null;
  /** Colour of the group heading as #RRGGBB; null uses the page default. */
  groupColor?: string | null;
  modelCodeProcessId: string;
  route: string[];
  isActive?: boolean;
  /** Operators allowed to dispatch it from Custom Task. */
  userIds?: string[];
}

export interface UpdateControlTaskData {
  code?: string;
  name?: string;
  groupName?: string | null;
  colorCode?: string | null;
  groupColor?: string | null;
  modelCodeProcessId?: string;
  route?: string[];
  isActive?: boolean;
  /** Replaces the whole assignee list when given; left alone when omitted. */
  userIds?: string[];
}

export type ControlTaskSortBy = 'code' | 'name' | 'createdAt';
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
  findByCode(code: string): Promise<ControlTaskWithRelations | null>;
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  /**
   * Active tasks registered to this operator, for the Custom Task picker.
   * Not paginated: it is a short, hand-curated list by design.
   */
  findAssignedToUser(userId: string): Promise<ControlTaskWithRelations[]>;
  modelCodeProcessExists(id: string): Promise<boolean>;
  findRouteOptions(): Promise<RouteOption[]>;
  create(data: CreateControlTaskData): Promise<ControlTaskWithRelations>;
  update(
    id: string,
    data: UpdateControlTaskData,
  ): Promise<ControlTaskWithRelations>;
  softDelete(id: string): Promise<void>;
}
