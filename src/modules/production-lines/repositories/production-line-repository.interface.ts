import { ProductionLine } from '@prisma/client';

export interface ProductionLineWithRelations extends ProductionLine {
  quarantineLine: { id: string; name: string };
  operator: { id: string; username: string };
}

export interface CreateProductionLineData {
  name: string;
  quarantineLineId: string;
  operatorId: string;
  isActive?: boolean;
}

export interface UpdateProductionLineData {
  name?: string;
  quarantineLineId?: string;
  operatorId?: string;
  isActive?: boolean;
}

export type ProductionLineSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllProductionLinesParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: ProductionLineSortBy;
  sortOrder: SortOrder;
}

export interface FindAllProductionLinesResult {
  items: ProductionLineWithRelations[];
  total: number;
}

export const PRODUCTION_LINES_REPOSITORY = 'PRODUCTION_LINES_REPOSITORY';

export interface IProductionLinesRepository {
  findAll(
    params: FindAllProductionLinesParams,
  ): Promise<FindAllProductionLinesResult>;
  findById(id: string): Promise<ProductionLineWithRelations | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsActiveQuarantineLineById(quarantineLineId: string): Promise<boolean>;
  existsActiveUserById(operatorId: string): Promise<boolean>;
  hasActiveAreas(id: string): Promise<boolean>;
  hasActiveRequestBoxes(id: string): Promise<boolean>;
  create(data: CreateProductionLineData): Promise<ProductionLine>;
  update(id: string, data: UpdateProductionLineData): Promise<ProductionLine>;
  softDelete(id: string): Promise<void>;
}
