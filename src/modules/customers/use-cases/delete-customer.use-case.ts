import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CUSTOMERS_REPOSITORY } from '../repositories/customer-repository.interface';
import type { ICustomersRepository } from '../repositories/customer-repository.interface';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.customersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    await this.customersRepository.softDelete(id);
  }
}
