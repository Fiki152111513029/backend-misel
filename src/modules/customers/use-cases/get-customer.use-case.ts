import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CUSTOMERS_REPOSITORY } from '../repositories/customer-repository.interface';
import type { ICustomersRepository } from '../repositories/customer-repository.interface';

@Injectable()
export class GetCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(id: string) {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }
}
