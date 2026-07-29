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
  /**
   * Most recent webhook call whose payload's orderId (or the "ordeId" typo
   * variant) matches — read live off the raw JSON, nothing is denormalized
   * into Task/WarehouseCartTask for this.
   */
  findLatestByOrderId(orderId: string): Promise<WebhookLogRecord | null>;
  findRobotIdByDeviceCode(deviceCode: string): Promise<string | null>;
  /**
   * The Model Code Process actually used to create the task behind this
   * orderId (via its Box Type for Task, or directly for WarehouseCartTask).
   */
  findModelProcessCodeNameByOrderId(orderId: string): Promise<string | null>;
  /** `statusComment{subTaskSeq}` (1-8) off the named Model Code Process. */
  findStatusComment(
    modelProcessCodeName: string,
    subTaskSeq: number,
  ): Promise<string | null>;
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
