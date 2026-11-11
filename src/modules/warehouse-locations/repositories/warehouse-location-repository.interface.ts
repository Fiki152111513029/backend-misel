import {
  WarehouseBinContent,
  WarehouseLocation,
  WarehouseLocationStatus,
} from '@prisma/client';

export interface CreateWarehouseLocationData {
  name: string;
  iRaypleLocationCode: string;
  isActive?: boolean;
}

export interface UpdateWarehouseLocationData {
  name?: string;
  iRaypleLocationCode?: string;
  isActive?: boolean;
  status?: WarehouseLocationStatus;
  /** null clears it — the finished goods were collected. */
  binContent?: WarehouseBinContent | null;
  /**
   * When an AMR last lifted a rack off this node. null hands authority over
   * the node's emptiness back to RCS — see the schema comment.
   */
  pickedEmptyAt?: Date | null;
}

export type WarehouseLocationSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllWarehouseLocationsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: WarehouseLocationSortBy;
  sortOrder: SortOrder;
}

export interface FindAllWarehouseLocationsResult {
  items: WarehouseLocation[];
  total: number;
}

export const WAREHOUSE_LOCATIONS_REPOSITORY = 'WAREHOUSE_LOCATIONS_REPOSITORY';

export interface IWarehouseLocationsRepository {
  findAll(
    params: FindAllWarehouseLocationsParams,
  ): Promise<FindAllWarehouseLocationsResult>;
  findById(id: string): Promise<WarehouseLocation | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsByLocationCode(code: string, excludeId?: string): Promise<boolean>;
  existsActiveByLocationCode(code: string): Promise<boolean>;
  findActiveByLocationCode(code: string): Promise<WarehouseLocation | null>;
  // Picks the dropping location for the Production->Warehouse Trolley Task
  // direction — first active, non-deleted, EMPTY location, deterministically
  // ordered so concurrent lookups don't jump around.
  findFirstActiveEmpty(): Promise<WarehouseLocation | null>;
  create(data: CreateWarehouseLocationData): Promise<WarehouseLocation>;
  update(
    id: string,
    data: UpdateWarehouseLocationData,
  ): Promise<WarehouseLocation>;
  softDelete(id: string): Promise<void>;
  /**
   * Soft-deletes several rows in one statement and reports how many it
   * actually touched.
   *
   * The count matters: ids that are already deleted, or were never there,
   * are silently not matched, so it is the only way the caller can tell a
   * partly-stale selection from a complete one.
   */
  softDeleteMany(ids: string[]): Promise<number>;
}
