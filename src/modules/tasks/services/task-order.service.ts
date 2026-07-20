import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import type { TaskWithRelations } from '../repositories/task-repository.interface';

export interface TaskOrderPayload {
  modelProcessCode: string;
  priority: number;
  fromSystem: string;
  orderId: string;
  taskOrderDetail: { taskPath: string }[];
}

export interface ExternalOrderInfo {
  OrderId?: string | number;
  orderId?: string | number;
  FixedRobotId?: string | number;
  fixedRobotId?: string | number;
  OrderStatus?: string | number;
  orderStatus?: string | number;
}

export type TaskListItem = Omit<TaskWithRelations, 'status' | 'robot'> & {
  status: string;
  robot: { id: string; name: string } | null;
};

function isOrderLike(item: unknown): item is ExternalOrderInfo {
  return (
    !!item &&
    typeof item === 'object' &&
    ('OrderId' in item || 'orderId' in item)
  );
}

// Same envelope-shape uncertainty as the device-info endpoint (see
// robot-telemetry.service.ts) — walk the payload for an array that looks
// like a list of orders, at any nesting depth. A majority match (rather than
// every single item) tolerates the odd malformed/legacy entry in the list.
function findOrderArray(payload: unknown, depth = 0): ExternalOrderInfo[] | null {
  if (depth > 6 || payload == null) return null;

  if (Array.isArray(payload)) {
    if (payload.length === 0) return payload as ExternalOrderInfo[];
    const matching = payload.filter(isOrderLike).length;
    if (matching / payload.length >= 0.5) {
      return payload.filter(isOrderLike) as ExternalOrderInfo[];
    }
    return null;
  }

  if (typeof payload === 'object') {
    // Check common envelope keys first so a genuine order array isn't
    // shadowed by an unrelated nested array elsewhere in the response.
    const record = payload as Record<string, unknown>;
    for (const key of ['data', 'list', 'orders', 'rows', 'result']) {
      if (key in record) {
        const found = findOrderArray(record[key], depth + 1);
        if (found && found.length > 0) return found;
      }
    }
    for (const value of Object.values(record)) {
      const found = findOrderArray(value, depth + 1);
      if (found && found.length > 0) return found;
    }
  }

  return null;
}

// Node's global fetch() (undici) fails silently against this AMR fleet server
// (see robot-telemetry.service.ts); raw http/https works, so we reuse the
// same low-level request pattern here.
function postJson(
  targetUrl: string,
  payload: unknown,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const client = url.protocol === 'https:' ? https : http;
    const body = JSON.stringify(payload);

    const request = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: timeoutMs,
      },
      (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          data += chunk;
        });
        response.on('end', () => {
          const status = response.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(new Error(`responded with status ${status}`));
            return;
          }
          resolve(data);
        });
      },
    );

    request.on('timeout', () =>
      request.destroy(new Error('request timed out')),
    );
    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

@Injectable()
export class TaskOrderService {
  private readonly logger = new Logger(TaskOrderService.name);

  constructor(private readonly configService: ConfigService) {}

  async addTask(payload: TaskOrderPayload): Promise<unknown> {
    const url = this.configService.get<string>('taskOrder.url');
    if (!url) {
      throw new ServiceUnavailableException('Task order URL is not configured');
    }

    this.logger.log(`POST ${url} — payload: ${JSON.stringify(payload)}`);

    let raw: string;
    try {
      raw = await postJson(url, payload, 5000);
    } catch (error) {
      this.logger.error(`Failed to reach task order endpoint: ${error}`);
      throw new BadGatewayException(
        `Failed to reach task order endpoint: ${error}`,
      );
    }

    this.logger.log(`Task order response for orderId ${payload.orderId}: ${raw}`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      this.logger.error(`Task order endpoint returned invalid JSON: ${raw}`);
      throw new BadGatewayException(
        `Task order endpoint returned invalid JSON: ${error}`,
      );
    }

    // This RCS server can return HTTP 200 with a body that still signals
    // failure (e.g. { code: 2103, desc: "任务流程模板编号不存在" } when
    // modelProcessCode doesn't match a known template). Its own success code
    // is 1000, not 0 — any other code must be treated as a rejection.
    const RCS_SUCCESS_CODE = 1000;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'code' in parsed &&
      typeof (parsed as { code: unknown }).code === 'number' &&
      (parsed as { code: number }).code !== RCS_SUCCESS_CODE
    ) {
      const desc =
        'desc' in parsed ? String((parsed as { desc: unknown }).desc) : '';
      throw new BadGatewayException(
        `Task order endpoint rejected the task (code ${(parsed as { code: number }).code}): ${desc}`,
      );
    }

    return parsed;
  }

  /**
   * Raw POST to the external order-list endpoint ({ areaId } JSON body).
   * Resilient by design — callers merge this onto our own DB-backed task
   * list, so a failure here should not break that read.
   */
  async getOrderList(areaId: number): Promise<ExternalOrderInfo[]> {
    const url = this.configService.get<string>('taskOrder.getOrderListUrl');
    if (!url) {
      this.logger.warn('Order list URL is not configured — skipping merge');
      return [];
    }

    this.logger.log(`POST ${url} — payload: ${JSON.stringify({ areaId })}`);

    let raw: string;
    try {
      raw = await postJson(url, { areaId }, 5000);
    } catch (error) {
      this.logger.warn(`Failed to reach order list endpoint: ${error}`);
      return [];
    }

    this.logger.log(`Order list response for areaId ${areaId}: ${raw}`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      this.logger.warn(`Order list endpoint returned invalid JSON: ${error}`);
      return [];
    }

    const orders = findOrderArray(parsed) ?? [];
    if (orders.length === 0) {
      this.logger.warn(
        `Order list response had no recognizable order array. Raw keys: ${
          parsed && typeof parsed === 'object'
            ? Object.keys(parsed).join(', ')
            : typeof parsed
        }`,
      );
    } else {
      this.logger.log(
        `Order list: found ${orders.length} order(s) — orderIds: ${orders
          .map((o) => o.OrderId ?? o.orderId)
          .join(', ')}`,
      );
    }

    return orders;
  }

  /**
   * Overlays live Robot/Status onto our own tasks by matching taskId against
   * the external OrderId — Task Action, Operator, and Created At stay as
   * recorded in our own database.
   */
  async mergeWithLiveOrders(
    tasks: TaskWithRelations[],
  ): Promise<TaskListItem[]> {
    if (tasks.length === 0) return [];

    const areaId = this.configService.get<number>('taskOrder.areaId') ?? 2;
    const orders = await this.getOrderList(areaId);
    const byOrderId = new Map(
      orders.map((order) => [String(order.OrderId ?? order.orderId), order]),
    );

    this.logger.log(
      `Matching ${tasks.length} task(s) against ${byOrderId.size} live order(s) — taskIds: ${tasks
        .map((t) => t.taskId)
        .join(', ')}`,
    );

    return tasks.map((task) => {
      const order = byOrderId.get(task.taskId);
      if (!order) {
        this.logger.debug(`No live order match for taskId ${task.taskId}`);
        return { ...task, status: task.status, robot: task.robot };
      }

      const fixedRobotId = order.FixedRobotId ?? order.fixedRobotId;
      const orderStatus = order.OrderStatus ?? order.orderStatus;

      return {
        ...task,
        status: orderStatus != null ? String(orderStatus) : task.status,
        robot:
          fixedRobotId != null
            ? { id: String(fixedRobotId), name: String(fixedRobotId) }
            : task.robot,
      };
    });
  }
}
