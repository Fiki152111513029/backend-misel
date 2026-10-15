import { CustomTaskRun, Prisma, TaskStatus } from '@prisma/client';

export type CustomTaskRunWithRelations = Prisma.CustomTaskRunGetPayload<{
  include: {
    operator: { select: { id: true; fullName: true } };
    robot: { select: { id: true; name: true } };
  };
}>;

// Cancelling needs the robot's device serial, which RCS calls deviceNumber
// — not something the list payload above carries.
export type CustomTaskRunForCancel = Prisma.CustomTaskRunGetPayload<{
  include: { robot: { select: { amrDeviceSerialNo: true } } };
}>;

export interface CreateCustomTaskRunData {
  orderId: string;
  controlTaskId: string;
  code: string;
  name: string;
  taskPath: string;
  modelProcessCode: string;
  operatorId: string;
  /** What to dispatch with later; only meaningful on a held run. */
  fromSystem?: string | null;
  priority?: number | null;
  /**
   * Set only when the run is being held back: the pickup code whose bin is
   * empty. The row is created with waitingForBinAt stamped and nothing is
   * sent to RCS until the watcher sees that bin filled.
   */
  waitingForCode?: string | null;
}

export type CustomTaskRunSortBy = 'createdAt' | 'code' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface FindAllCustomTaskRunsParams {
  page: number;
  limit: number;
  /** Matches code, name or orderId. */
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
  findById(id: string): Promise<CustomTaskRunForCancel | null>;
  /**
   * A run of this Control Task that is still outstanding — PENDING or
   * IN_PROGRESS and not cancelled. Used to stop the same task being
   * dispatched twice while the first one is still on the floor.
   */
  findActiveByControlTaskId(
    controlTaskId: string,
  ): Promise<CustomTaskRun | null>;
  /**
   * Runs held back waiting for their pickup bin, oldest first. FIFO matters:
   * when two tasks wait on the same rack, the one asked for first is the one
   * that gets the pallet.
   */
  findWaitingForBin(): Promise<CustomTaskRun[]>;
  /**
   * Clears the wait stamp once the run has been accepted by RCS, so the
   * watcher stops considering it.
   */
  markDispatched(id: string): Promise<CustomTaskRun>;
  /** Marks the run cancelled: FAILED plus a cancelledAt stamp. */
  cancel(id: string): Promise<CustomTaskRunWithRelations>;
}
