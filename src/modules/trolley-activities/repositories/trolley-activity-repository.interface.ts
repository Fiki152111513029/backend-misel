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

export interface ITrolleyActivitiesRepository {
  create(data: CreateTrolleyActivityData): Promise<TrolleyActivity>;
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
}
