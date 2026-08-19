import { TaskStatus, TrolleyActivity, TrolleyStatus } from '@prisma/client';

export interface TrolleyActivityWithRelations extends TrolleyActivity {
  user: { id: string; fullName: string };
  trolley: { id: string; code: string; name: string };
  robot: { id: string; name: string } | null;
}

export interface CreateTrolleyActivityData {
  userId: string;
  trolleyId: string;
  statusBeginning: TrolleyStatus;
  statusEnd: TrolleyStatus;
  pickupLocationCode: string;
  droppingLocationCode?: string;
  startDate: Date;
  endDate: Date;
  taskId: string;
}

export interface FindAllTrolleyActivitiesParams {
  page: number;
  limit: number;
}

export interface FindAllTrolleyActivitiesResult {
  items: TrolleyActivityWithRelations[];
  total: number;
}

export const TROLLEY_ACTIVITIES_REPOSITORY = 'TROLLEY_ACTIVITIES_REPOSITORY';

export interface ActiveTrolleyActivityByRobot {
  robotId: string;
  // What the trolley physically has on it *right now*, while still in
  // transit — statusBeginning, not statusEnd. The trolley's own `status`
  // field already flips to statusEnd the instant the task order is
  // accepted (see CreateTrolleyActivityUseCase), well before the robot has
  // actually delivered it, so it can't be used to represent "what's being
  // carried" while the task is still PENDING/IN_PROGRESS.
  carrying: TrolleyStatus;
}

export interface ITrolleyActivitiesRepository {
  create(data: CreateTrolleyActivityData): Promise<TrolleyActivityWithRelations>;
  findById(id: string): Promise<TrolleyActivityWithRelations | null>;
  findAll(
    params: FindAllTrolleyActivitiesParams,
  ): Promise<FindAllTrolleyActivitiesResult>;
  countByUserUpTo(userId: string, createdAt: Date): Promise<number>;
  updateStatusByTaskId(
    taskId: string,
    status: TaskStatus,
    robotId?: string,
  ): Promise<boolean>;
  findActiveByRobot(): Promise<ActiveTrolleyActivityByRobot[]>;
}
