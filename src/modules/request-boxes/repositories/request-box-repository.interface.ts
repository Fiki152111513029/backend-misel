import { RequestBox } from '@prisma/client';

export interface RequestBoxWithRelations extends RequestBox {
  productionLine: { id: string; name: string };
  boxType: { id: string; name: string; colorCode: string };
}

export interface CreateRequestBoxData {
  productionLineId: string;
  boxTypeId: string;
  qty: number;
}

export type RequestBoxSortBy = 'createdAt' | 'qty';
export type SortOrder = 'asc' | 'desc';

export interface FindAllRequestBoxesParams {
  page: number;
  limit: number;
  sortBy: RequestBoxSortBy;
  sortOrder: SortOrder;
}

export interface FindAllRequestBoxesResult {
  items: RequestBoxWithRelations[];
  total: number;
}

export const REQUEST_BOXES_REPOSITORY = 'REQUEST_BOXES_REPOSITORY';

export interface IRequestBoxesRepository {
  findAll(
    params: FindAllRequestBoxesParams,
  ): Promise<FindAllRequestBoxesResult>;
  findById(id: string): Promise<RequestBoxWithRelations | null>;
  existsActiveBoxTypeById(boxTypeId: string): Promise<boolean>;
  findProductionLineOperatorId(productionLineId: string): Promise<string | null>;
  create(data: CreateRequestBoxData): Promise<RequestBox>;
  softDelete(id: string): Promise<void>;
}
