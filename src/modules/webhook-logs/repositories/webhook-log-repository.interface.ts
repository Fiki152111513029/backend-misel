import { TaskStatus, WarehouseCartTaskStatus } from '@prisma/client';

export interface CreateWebhookLogData {
  method: string;
  endpoint: string;
  requestPayload: unknown;
  responsePayload: unknown;
}

export interface WebhookLogRecord {
  id: string;
  method: string;
  endpoint: string;
  requestPayload: unknown;
  responsePayload: unknown;
  createdAt: Date;
}

export interface FindAllWebhookLogsParams {
  page: number;
  limit: number;
}

export interface FindAllWebhookLogsResult {
  items: WebhookLogRecord[];
  total: number;
}

export const WEBHOOK_LOGS_REPOSITORY = 'WEBHOOK_LOGS_REPOSITORY';

export interface IWebhookLogsRepository {
  createLog(data: CreateWebhookLogData): Promise<void>;
  findAll(params: FindAllWebhookLogsParams): Promise<FindAllWebhookLogsResult>;
  findRobotIdByDeviceCode(deviceCode: string): Promise<string | null>;
  /** Returns true if a Task with this taskId was found and updated. */
  updateTaskStatusByTaskId(
    taskId: string,
    status: TaskStatus,
    robotId?: string,
  ): Promise<boolean>;
  /** Returns true if a WarehouseCartTask with this taskId was found and updated. */
  updateWarehouseCartTaskStatusByTaskId(
    taskId: string,
    status: WarehouseCartTaskStatus,
    robotId?: string,
  ): Promise<boolean>;
}
