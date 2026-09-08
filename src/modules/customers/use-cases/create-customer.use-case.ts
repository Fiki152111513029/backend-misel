import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CUSTOMERS_REPOSITORY } from '../repositories/customer-repository.interface';
import type { ICustomersRepository } from '../repositories/customer-repository.interface';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(dto: CreateCustomerDto) {
    const nameTaken = await this.customersRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Customer name already in use');
    }

    try {
      return await this.customersRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('Customer name already in use');
      }
      throw error;
    }
  }
}
