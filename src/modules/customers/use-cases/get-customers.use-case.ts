import { Inject, Injectable } from '@nestjs/common';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { CUSTOMERS_REPOSITORY } from '../repositories/customer-repository.interface';
import type { ICustomersRepository } from '../repositories/customer-repository.interface';

@Injectable()
export class GetCustomersUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(query: CustomerQueryDto) {
    const { items, total } = await this.customersRepository.findAll(query);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
