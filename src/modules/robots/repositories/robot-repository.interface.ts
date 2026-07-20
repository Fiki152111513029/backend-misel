import { Robot } from '@prisma/client';

export interface CreateRobotData {
  name: string;
  amrDeviceSerialNo: string;
  amrDeviceNo: string;
  areaId: number;
  isActive?: boolean;
}

export interface UpdateRobotData {
  name?: string;
  amrDeviceSerialNo?: string;
  amrDeviceNo?: string;
  areaId?: number;
  isActive?: boolean;
}

export type RobotSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllRobotsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: RobotSortBy;
  sortOrder: SortOrder;
}

export interface FindAllRobotsResult {
  items: Robot[];
  total: number;
}

export const ROBOTS_REPOSITORY = 'ROBOTS_REPOSITORY';

export interface IRobotsRepository {
  findAll(params: FindAllRobotsParams): Promise<FindAllRobotsResult>;
  findById(id: string): Promise<Robot | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsBySerialNo(serialNo: string, excludeId?: string): Promise<boolean>;
  existsByDeviceNo(deviceNo: string, excludeId?: string): Promise<boolean>;
  create(data: CreateRobotData): Promise<Robot>;
  update(id: string, data: UpdateRobotData): Promise<Robot>;
  softDelete(id: string): Promise<void>;
}
