import { CustomTaskRun, Prisma, TaskStatus } from '@prisma/client';

export type CustomTaskRunWithRelations = Prisma.CustomTaskRunGetPayload<{
  include: {
    operator: { select: { id: true; fullName: true } };
    robot: { select: { id: true; name: true } };
  };
}>;

export interface CreateCustomTaskRunData {
  orderId: string;
  controlTaskId: string;
  abjad: string;
  name: string;
  taskPath: string;
  modelProcessCode: string;
  operatorId: string;
}

export type CustomTaskRunSortBy = 'createdAt' | 'abjad' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface FindAllCustomTaskRunsParams {
  page: number;
  limit: number;
  /** Matches abjad, name or orderId. */
  search?: string;
  status?: TaskStatus;
  /** Single calendar day (server local time), as YYYY-MM-DD. */
  date?: string;
  sortBy: CustomTaskRunSortBy;
  sortOrder: SortOrder;
}

export interface FindAllCustomTaskRunsResult {
  items: CustomTaskRunWithRelations[];
  total: number;
}

export const CUSTOM_TASK_RUNS_REPOSITORY = 'CUSTOM_TASK_RUNS_REPOSITORY';

export interface ICustomTaskRunsRepository {
  create(data: CreateCustomTaskRunData): Promise<CustomTaskRun>;
  findAll(
    params: FindAllCustomTaskRunsParams,
  ): Promise<FindAllCustomTaskRunsResult>;
  findById(id: string): Promise<CustomTaskRun | null>;
  /** Marks the run cancelled: FAILED plus a cancelledAt stamp. */
  cancel(id: string): Promise<CustomTaskRunWithRelations>;
}
