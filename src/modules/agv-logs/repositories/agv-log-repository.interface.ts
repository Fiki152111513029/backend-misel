export interface CreateAgvLogData {
  method: string;
  endpoint: string;
  deviceCode: string | null;
  requestPayload: unknown;
  responsePayload: unknown;
}

export interface AgvLogRecord {
  id: string;
  method: string;
  endpoint: string;
  deviceCode: string | null;
  requestPayload: unknown;
  responsePayload: unknown;
  createdAt: Date;
}

export interface FindAllAgvLogsParams {
  page: number;
  limit: number;
  /** Narrows to one robot. */
  deviceCode?: string;
  /** Single calendar day (server local time), as YYYY-MM-DD. */
  date?: string;
}

export interface FindAllAgvLogsResult {
  items: AgvLogRecord[];
  total: number;
}

export const AGV_LOGS_REPOSITORY = 'AGV_LOGS_REPOSITORY';

export interface IAgvLogsRepository {
  createLog(data: CreateAgvLogData): Promise<void>;
  findAll(params: FindAllAgvLogsParams): Promise<FindAllAgvLogsResult>;
  /** Device codes seen in the stored reports, for the filter dropdown. */
  findDeviceCodes(): Promise<string[]>;
  /** Returns the number of rows deleted — used by AgvLogRetentionService. */
  deleteOlderThan(cutoff: Date): Promise<number>;
}
