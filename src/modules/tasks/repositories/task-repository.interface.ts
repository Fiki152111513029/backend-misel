import { Task, TaskAction } from '@prisma/client';

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
}

export interface FindAllTasksResult {
  items: TaskWithRelations[];
  total: number;
}

export const TASKS_REPOSITORY = 'TASKS_REPOSITORY';

export interface ITasksRepository {
  findAll(params: FindAllTasksParams): Promise<FindAllTasksResult>;
  findById(id: string): Promise<TaskWithRelations | null>;
  findProductionLineAreaWithRelations(
    id: string,
  ): Promise<ProductionLineAreaForTask | null>;
  findActiveBoxTypeById(id: string): Promise<BoxTypeForTask | null>;
  findFirstActiveQuarantineAreaByLineId(
    quarantineLineId: string,
  ): Promise<QuarantineAreaForTask | null>;
  create(data: CreateTaskData): Promise<Task>;
}
