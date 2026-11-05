import {
  PlcDataType,
  PlcDevice,
  PlcReading,
  PlcRegisterType,
  PlcTag,
  PlcWordOrder,
} from '@prisma/client';

export type PlcDeviceWithTags = PlcDevice & { tags: PlcTag[] };
export type PlcTagWithDevice = PlcTag & {
  device: Pick<PlcDevice, 'id' | 'name'> | null;
};
export type PlcReadingWithTag = PlcReading & {
  tag: Pick<PlcTag, 'id' | 'name' | 'unit'> | null;
};

export interface CreatePlcDeviceData {
  name: string;
  host: string;
  port?: number;
  unitId?: number;
  pollIntervalMs?: number;
  timeoutMs?: number;
  description?: string | null;
  isActive?: boolean;
}

export type UpdatePlcDeviceData = Partial<CreatePlcDeviceData>;

export interface CreatePlcTagData {
  deviceId: string;
  name: string;
  address: number;
  registerType: PlcRegisterType;
  dataType?: PlcDataType;
  wordOrder?: PlcWordOrder;
  scale?: number;
  unit?: string | null;
  description?: string | null;
  isActive?: boolean;
  logEnabled?: boolean;
}

export type UpdatePlcTagData = Partial<Omit<CreatePlcTagData, 'deviceId'>>;

export interface FindAllPlcDevicesParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: 'name' | 'host' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface FindAllPlcTagsParams {
  page: number;
  limit: number;
  search?: string;
  deviceId?: string;
  sortBy: 'name' | 'address' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface FindAllPlcReadingsParams {
  page: number;
  limit: number;
  tagId?: string;
  /** Single calendar day (server local time), as YYYY-MM-DD. */
  date?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/** One value change, as the poller found it. */
export interface PlcReadingInput {
  tagId: string;
  value: number;
}

export const PLC_REPOSITORY = 'PLC_REPOSITORY';

export interface IPlcRepository {
  findAllDevices(
    params: FindAllPlcDevicesParams,
  ): Promise<PaginatedResult<PlcDeviceWithTags>>;
  findDeviceById(id: string): Promise<PlcDeviceWithTags | null>;
  /**
   * Active devices with their active tags — the poller's whole view of the
   * world, read on a timer rather than per poll.
   */
  findPollableDevices(): Promise<PlcDeviceWithTags[]>;
  deviceNameExists(name: string, excludeId?: string): Promise<boolean>;
  createDevice(data: CreatePlcDeviceData): Promise<PlcDeviceWithTags>;
  updateDevice(
    id: string,
    data: UpdatePlcDeviceData,
  ): Promise<PlcDeviceWithTags>;
  softDeleteDevice(id: string): Promise<void>;

  findAllTags(
    params: FindAllPlcTagsParams,
  ): Promise<PaginatedResult<PlcTagWithDevice>>;
  findTagById(id: string): Promise<PlcTagWithDevice | null>;
  tagNameExists(
    deviceId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean>;
  createTag(data: CreatePlcTagData): Promise<PlcTagWithDevice>;
  updateTag(id: string, data: UpdatePlcTagData): Promise<PlcTagWithDevice>;
  softDeleteTag(id: string): Promise<void>;

  /** Appends value changes and trims the history back under its cap. */
  recordReadings(readings: PlcReadingInput[]): Promise<void>;
  findAllReadings(
    params: FindAllPlcReadingsParams,
  ): Promise<PaginatedResult<PlcReadingWithTag>>;
}
