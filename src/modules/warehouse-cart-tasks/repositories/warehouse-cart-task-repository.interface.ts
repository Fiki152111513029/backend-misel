import { WarehouseCartTask } from '@prisma/client';

export interface CreateWarehouseCartTaskData {
  taskId: string;
  taskPath: string;
  warehouseLineLocationId: string;
  modelCodeProcessId: string;
  operatorId: string;
}

export interface WarehouseCartTaskWithRelations extends WarehouseCartTask {
  warehouseLineLocation: { id: string; name: string };
  modelCodeProcess: { id: string; name: string };
  robot: { id: string; name: string } | null;
  operator: { id: string; username: string; fullName: string };
}

export type WarehouseCartTaskSortBy = 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllWarehouseCartTasksParams {
  page: number;
  limit: number;
  sortBy: WarehouseCartTaskSortBy;
  sortOrder: SortOrder;
}

export interface FindAllWarehouseCartTasksResult {
  items: WarehouseCartTaskWithRelations[];
  total: number;
}

export const WAREHOUSE_CART_TASKS_REPOSITORY = 'WAREHOUSE_CART_TASKS_REPOSITORY';

export interface IWarehouseCartTasksRepository {
  findAll(
    params: FindAllWarehouseCartTasksParams,
  ): Promise<FindAllWarehouseCartTasksResult>;
  create(data: CreateWarehouseCartTaskData): Promise<WarehouseCartTask>;
}
