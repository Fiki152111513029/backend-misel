import { ProductionLineArea, ProductionLineAreaType } from '@prisma/client';

export interface ProductionLineAreaWithRelations extends ProductionLineArea {
  productionLine: { id: string; name: string };
  eximLocation: { id: string; name: string };
  emptyPalletLocation: { id: string; name: string };
}

export interface CreateProductionLineAreaData {
  name: string;
  type: ProductionLineAreaType;
  iRaypleLocationCode: string;
  productionLineId: string;
  eximLocationId: string;
  emptyPalletLocationId: string;
  order: number;
}

export interface UpdateProductionLineAreaData {
  name?: string;
  type?: ProductionLineAreaType;
  iRaypleLocationCode?: string;
  productionLineId?: string;
  eximLocationId?: string;
  emptyPalletLocationId?: string;
  order?: number;
}

export type ProductionLineAreaSortBy = 'name' | 'order' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllProductionLineAreasParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: ProductionLineAreaSortBy;
  sortOrder: SortOrder;
}

export interface FindAllProductionLineAreasResult {
  items: ProductionLineAreaWithRelations[];
  total: number;
}

export const PRODUCTION_LINE_AREAS_REPOSITORY =
  'PRODUCTION_LINE_AREAS_REPOSITORY';

export interface IProductionLineAreasRepository {
  findAll(
    params: FindAllProductionLineAreasParams,
  ): Promise<FindAllProductionLineAreasResult>;
  findById(id: string): Promise<ProductionLineAreaWithRelations | null>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  existsActiveProductionLineById(productionLineId: string): Promise<boolean>;
  existsActiveEximLocationById(eximLocationId: string): Promise<boolean>;
  existsActiveEmptyPalletLocationById(
    emptyPalletLocationId: string,
  ): Promise<boolean>;
  create(data: CreateProductionLineAreaData): Promise<ProductionLineArea>;
  update(
    id: string,
    data: UpdateProductionLineAreaData,
  ): Promise<ProductionLineArea>;
  reorderMany(items: { id: string; order: number }[]): Promise<void>;
  softDelete(id: string): Promise<void>;
}
