import { Task, TaskAction, TaskStatus } from '@prisma/client';

export interface ProductionLineAreaForTask {
  id: string;
  iRaypleLocationCode: string;
  productionLine: { id: string; operatorId: string; quarantineLineId: string };
  eximLocation: { iRaypleLocationCode: string };
  emptyPalletLocation: { iRaypleLocationCode: string };
}

export interface BoxTypeForTask {
  id: string;
  modelProcessCode: string;
  fromSystem: string;
}

export interface QuarantineAreaForTask {
  id: string;
  iRaypleLocationCode: string;
}

export interface TaskForQuarantineRelease {
  id: string;
  taskId: string;
  quarantineArea: { iRaypleLocationCode: string } | null;
  productionLineArea: {
    eximLocation: { iRaypleLocationCode: string };
  } | null;
  productionLine: {
    quarantineLine: { modelCodeProcess: { name: string } | null };
  };
  boxType: { fromSystem: string };
}

export interface CreateTaskData {
  taskId: string;
  taskAction: TaskAction;
  taskPath: string;
  productionLineId: string;
  productionLineAreaId?: string;
  quarantineAreaId?: string;
  boxTypeId: string;
  operatorId: string;
}

export interface TaskWithRelations extends Task {
  productionLine: {
    id: string;
    name: string;
    quarantineLine: { id: string; name: string };
  };
  productionLineArea: { id: string; name: string } | null;
  quarantineArea: { id: string; name: string } | null;
  boxType: { id: string; name: string };
  robot: { id: string; name: string } | null;
  operator: { id: string; username: string; fullName: string };
}

export type TaskSortBy = 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllTasksParams {
  page: number;
  limit: number;
  sortBy: TaskSortBy;
  sortOrder: SortOrder;
  dateFrom?: string;
  dateTo?: string;
  operatorId?: string;
  status?: TaskStatus;
  taskAction?: TaskAction;
  activeOnly?: boolean;
}

export interface FindAllTasksResult {
  items: TaskWithRelations[];
  total: number;
}

export interface TaskOperatorOption {
  id: string;
  username: string;
  fullName: string;
}

export const TASKS_REPOSITORY = 'TASKS_REPOSITORY';

export interface ITasksRepository {
  findAll(params: FindAllTasksParams): Promise<FindAllTasksResult>;
  findById(id: string): Promise<TaskWithRelations | null>;
  findByIdForQuarantineRelease(
    id: string,
  ): Promise<TaskForQuarantineRelease | null>;
  findDistinctOperators(): Promise<TaskOperatorOption[]>;
  findProductionLineAreaWithRelations(
    id: string,
  ): Promise<ProductionLineAreaForTask | null>;
  findActiveBoxTypeById(id: string): Promise<BoxTypeForTask | null>;
  findFirstActiveQuarantineAreaByLineId(
    quarantineLineId: string,
  ): Promise<QuarantineAreaForTask | null>;
  create(data: CreateTaskData): Promise<Task>;
  updateStatus(id: string, status: TaskStatus): Promise<Task>;
}
