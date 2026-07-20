import { WarehouseOperatorLocation } from '@prisma/client';

export interface WarehouseOperatorLocationWithOperator extends WarehouseOperatorLocation {
  operator: { id: string; username: string };
}

export interface AvailableOperator {
  id: string;
  username: string;
}

export interface CreateWarehouseOperatorLocationData {
  name: string;
  locationCode: string;
  operatorId: string;
}

export interface UpdateWarehouseOperatorLocationData {
  name?: string;
  locationCode?: string;
  operatorId?: string;
}

export type WarehouseOperatorLocationSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllWarehouseOperatorLocationsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: WarehouseOperatorLocationSortBy;
  sortOrder: SortOrder;
}

export interface FindAllWarehouseOperatorLocationsResult {
  items: WarehouseOperatorLocationWithOperator[];
  total: number;
}

export const WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY =
  'WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY';

export interface IWarehouseOperatorLocationsRepository {
  findAll(
    params: FindAllWarehouseOperatorLocationsParams,
  ): Promise<FindAllWarehouseOperatorLocationsResult>;
  findById(id: string): Promise<WarehouseOperatorLocationWithOperator | null>;
  findByOperatorId(
    operatorId: string,
  ): Promise<WarehouseOperatorLocationWithOperator | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  existsByOperatorId(operatorId: string, excludeId?: string): Promise<boolean>;
  existsActiveWarehouseUserById(operatorId: string): Promise<boolean>;
  findAvailableOperators(
    excludeLocationId?: string,
  ): Promise<AvailableOperator[]>;
  create(
    data: CreateWarehouseOperatorLocationData,
  ): Promise<WarehouseOperatorLocation>;
  update(
    id: string,
    data: UpdateWarehouseOperatorLocationData,
  ): Promise<WarehouseOperatorLocation>;
  softDelete(id: string): Promise<void>;
}
