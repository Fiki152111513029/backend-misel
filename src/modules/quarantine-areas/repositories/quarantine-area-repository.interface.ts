import { Prisma, QuarantineArea } from '@prisma/client';

export type QuarantineAreaWithLine = Prisma.QuarantineAreaGetPayload<{
  include: { quarantineLine: true };
}>;

export interface CreateQuarantineAreaData {
  name: string;
  iRaypleLocationCode: string;
  quarantineLineId: string;
}

export interface UpdateQuarantineAreaData {
  name?: string;
  iRaypleLocationCode?: string;
  quarantineLineId?: string;
}

export type QuarantineAreaSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllQuarantineAreasParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: QuarantineAreaSortBy;
  sortOrder: SortOrder;
}

export interface FindAllQuarantineAreasResult {
  items: QuarantineAreaWithLine[];
  total: number;
}

export const QUARANTINE_AREAS_REPOSITORY = 'QUARANTINE_AREAS_REPOSITORY';

export interface IQuarantineAreasRepository {
  findAll(
    params: FindAllQuarantineAreasParams,
  ): Promise<FindAllQuarantineAreasResult>;
  findById(id: string): Promise<QuarantineAreaWithLine | null>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  existsActiveLineById(quarantineLineId: string): Promise<boolean>;
  create(data: CreateQuarantineAreaData): Promise<QuarantineArea>;
  update(id: string, data: UpdateQuarantineAreaData): Promise<QuarantineArea>;
  softDelete(id: string): Promise<void>;
}
