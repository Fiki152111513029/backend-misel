import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export type NodeStatus = '0' | '2';
export const NODE_STATUS_EMPTY: NodeStatus = '0';
export const NODE_STATUS_FULL: NodeStatus = '2';

export interface StockStatusRow {
  areaId: string;
  inTask: string;
  qrContent: string;
  stockStatus: number;
}

// Node's global fetch() (undici) fails silently against this AMR fleet
// server (see robot-telemetry.service.ts / task-order.service.ts); raw
// http/https works, so the same low-level request pattern is reused here.
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

// Same envelope-shape uncertainty as the other RCS integrations (device
// list, order list) — walk the payload for an array that looks like a list
// of stock-status rows, at any nesting depth, instead of hardcoding one
// guessed shape.
function isStockStatusLike(item: unknown): item is StockStatusRow {
  return (
    !!item &&
    typeof item === 'object' &&
    'qrContent' in item &&
    'stockStatus' in item
  );
}

function findStockStatusArray(
  payload: unknown,
  depth = 0,
): StockStatusRow[] | null {
  if (depth > 6 || payload == null) return null;

  if (Array.isArray(payload)) {
    if (payload.length === 0) return payload as StockStatusRow[];
    const matching = payload.filter(isStockStatusLike).length;
    if (matching / payload.length >= 0.5) {
      return payload.filter(isStockStatusLike) as StockStatusRow[];
    }
    return null;
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['data', 'list', 'rows', 'result']) {
      if (key in record) {
        const found = findStockStatusArray(record[key], depth + 1);
        if (found && found.length > 0) return found;
      }
    }
    // A single stock-status object (not wrapped in an array) is also valid.
    if (isStockStatusLike(payload)) return [payload];
    for (const value of Object.values(record)) {
      const found = findStockStatusArray(value, depth + 1);
      if (found && found.length > 0) return found;
    }
  }

  return null;
}

@Injectable()
export class RcsStockStatusService {
  private readonly logger = new Logger(RcsStockStatusService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Tells RCS a Warehouse/Production Location's bin is now empty or full —
   * fired off the task-status webhook (Picked -> empty the pickup location,
   * Placed -> fill the dropping location), not at task-submit time, so RCS's
   * own record reflects physical reality. Best-effort: failures are logged
   * and swallowed so a flaky call here never breaks webhook processing.
   */
  async updateStockStatus(qrContent: string, nodeStatus: NodeStatus): Promise<void> {
    const url = this.configService.get<string>('stockStatus.updateUrl');
    if (!url) {
      this.logger.warn('Stock status update URL is not configured — skipping');
      return;
    }

    const payload = { qrContent, nodeStatus };
    this.logger.log(`POST ${url} — payload: ${JSON.stringify(payload)}`);

    try {
      const raw = await postJson(url, payload, 5000);
      this.logger.log(`Stock status update response for ${qrContent}: ${raw}`);
    } catch (error) {
      this.logger.error(
        `Failed to update stock status for ${qrContent}: ${error}`,
      );
    }
  }

  /**
   * Live full/empty status of every Warehouse/Production Location node in
   * an area, straight from RCS — the Factory Map's source of truth for node
   * icons, since RCS is the system other integrations may also write stock
   * status into directly. Resilient by design: a failure returns an empty
   * list rather than throwing, so the map just falls back to its plain icon.
   */
  async getStockStatus(areaId: number): Promise<StockStatusRow[]> {
    const url = this.configService.get<string>('stockStatus.getUrl');
    if (!url) {
      this.logger.warn('Stock status get URL is not configured — skipping');
      return [];
    }

    let raw: string;
    try {
      raw = await postJson(url, { areaId }, 5000);
    } catch (error) {
      this.logger.warn(`Failed to reach stock status endpoint: ${error}`);
      return [];
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      this.logger.warn(`Stock status endpoint returned invalid JSON: ${error}`);
      return [];
    }

    return findStockStatusArray(parsed) ?? [];
  }
}
