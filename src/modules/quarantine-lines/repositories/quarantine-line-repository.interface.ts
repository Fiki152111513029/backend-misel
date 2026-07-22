import { QuarantineLine } from '@prisma/client';

export interface CreateQuarantineLineData {
  name: string;
  isActive?: boolean;
  modelCodeProcessId?: string;
}

export interface UpdateQuarantineLineData {
  name?: string;
  isActive?: boolean;
  modelCodeProcessId?: string;
}

export interface ModelCodeProcessRefForQuarantineLine {
  id: string;
  name: string;
  fromSystem: string;
  isActive: boolean;
}

export interface QuarantineLineWithRelations extends QuarantineLine {
  modelCodeProcess: ModelCodeProcessRefForQuarantineLine | null;
}

export type QuarantineLineSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllQuarantineLinesParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: QuarantineLineSortBy;
  sortOrder: SortOrder;
}

export interface FindAllQuarantineLinesResult {
  items: QuarantineLineWithRelations[];
  total: number;
}

export const QUARANTINE_LINES_REPOSITORY = 'QUARANTINE_LINES_REPOSITORY';

export interface IQuarantineLinesRepository {
  findAll(
    params: FindAllQuarantineLinesParams,
  ): Promise<FindAllQuarantineLinesResult>;
  findById(id: string): Promise<QuarantineLineWithRelations | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsActiveModelCodeProcessById(modelCodeProcessId: string): Promise<boolean>;
  hasActiveAreas(id: string): Promise<boolean>;
  hasActiveProductionLines(id: string): Promise<boolean>;
  create(data: CreateQuarantineLineData): Promise<QuarantineLine>;
  update(id: string, data: UpdateQuarantineLineData): Promise<QuarantineLine>;
  softDelete(id: string): Promise<void>;
}
