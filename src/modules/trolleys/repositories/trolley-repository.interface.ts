import { Trolley, TrolleyStatus } from '@prisma/client';

export interface TrolleyWithRelations extends Trolley {
  type: { id: string; name: string };
  category: {
    id: string;
    name: string;
    // Used to build the RCS task-order payload for the Operator Trolley
    // Task direction (Production->Warehouse) — see
    // CreateTrolleyActivityUseCase.
    modelCodeProcess: { id: string; name: string; fromSystem: string } | null;
  } | null;
  modelCodeProcess: { id: string; name: string; fromSystem: string } | null;
  customer: { id: string; name: string } | null;
}

export interface CreateTrolleyData {
  name: string;
  code: string;
  status?: TrolleyStatus;
  trolleyTypeId: string;
  trolleyCategoryId?: string;
  droppingLocationCode?: string;
  modelCodeProcessId?: string;
  customerId?: string;
}

export interface UpdateTrolleyData {
  name?: string;
  code?: string;
  status?: TrolleyStatus;
  trolleyTypeId?: string;
  trolleyCategoryId?: string;
  droppingLocationCode?: string;
  modelCodeProcessId?: string;
  customerId?: string;
  // Only ever set by ReceiveTaskStatusWebhookUseCase (on a "Placed" event)
  // — not exposed on CreateTrolleyDto/UpdateTrolleyDto, since it reflects
  // physical reality reported by RCS, not something an admin should edit.
  currentLocationCode?: string;
}

export type TrolleySortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllTrolleysParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: TrolleySortBy;
  sortOrder: SortOrder;
}

export interface FindAllTrolleysResult {
  items: TrolleyWithRelations[];
  total: number;
}

export const TROLLEYS_REPOSITORY = 'TROLLEYS_REPOSITORY';

export interface ITrolleysRepository {
  findAll(params: FindAllTrolleysParams): Promise<FindAllTrolleysResult>;
  findById(id: string): Promise<TrolleyWithRelations | null>;
  findActiveByCode(code: string): Promise<TrolleyWithRelations | null>;
  // Scoped by trolleyTypeId — name/code only need to be unique within the
  // same Trolley Type, not globally (see the composite partial unique
  // indexes on Trolley in the migration).
  existsByName(
    name: string,
    trolleyTypeId: string,
    excludeId?: string,
  ): Promise<boolean>;
  existsByCode(
    code: string,
    trolleyTypeId: string,
    excludeId?: string,
  ): Promise<boolean>;
  existsActiveTrolleyTypeById(id: string): Promise<boolean>;
  existsActiveTrolleyCategoryById(id: string): Promise<boolean>;
  existsActiveModelCodeProcessById(id: string): Promise<boolean>;
  existsActiveCustomerById(id: string): Promise<boolean>;
  create(data: CreateTrolleyData): Promise<Trolley>;
  update(id: string, data: UpdateTrolleyData): Promise<Trolley>;
  softDelete(id: string): Promise<void>;
}
