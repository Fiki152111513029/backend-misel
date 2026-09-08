import { Customer } from '@prisma/client';

export interface CreateCustomerData {
  name: string;
  isActive?: boolean;
}

export interface UpdateCustomerData {
  name?: string;
  isActive?: boolean;
}

export type CustomerSortBy = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FindAllCustomersParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: CustomerSortBy;
  sortOrder: SortOrder;
}

export interface FindAllCustomersResult {
  items: Customer[];
  total: number;
}

export const CUSTOMERS_REPOSITORY = 'CUSTOMERS_REPOSITORY';

export interface ICustomersRepository {
  findAll(params: FindAllCustomersParams): Promise<FindAllCustomersResult>;
  findById(id: string): Promise<Customer | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  create(data: CreateCustomerData): Promise<Customer>;
  update(id: string, data: UpdateCustomerData): Promise<Customer>;
  softDelete(id: string): Promise<void>;
}
