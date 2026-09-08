import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CUSTOMERS_REPOSITORY } from '../repositories/customer-repository.interface';
import type { ICustomersRepository } from '../repositories/customer-repository.interface';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(id: string, dto: UpdateCustomerDto) {
    const existing = await this.customersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.customersRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Customer name already in use');
      }
    }

    try {
      return await this.customersRepository.update(id, dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('Customer name already in use');
      }
      throw error;
    }
  }
}
