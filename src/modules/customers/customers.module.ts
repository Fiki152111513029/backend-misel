import { Module } from '@nestjs/common';
import { CustomerController } from './controllers/customer.controller';
import { CUSTOMERS_REPOSITORY } from './repositories/customer-repository.interface';
import { CustomerRepository } from './repositories/customer.repository';
import { CreateCustomerUseCase } from './use-cases/create-customer.use-case';
import { DeleteCustomerUseCase } from './use-cases/delete-customer.use-case';
import { GetCustomerUseCase } from './use-cases/get-customer.use-case';
import { GetCustomersUseCase } from './use-cases/get-customers.use-case';
import { UpdateCustomerUseCase } from './use-cases/update-customer.use-case';

@Module({
  controllers: [CustomerController],
  providers: [
    { provide: CUSTOMERS_REPOSITORY, useClass: CustomerRepository },
    CreateCustomerUseCase,
    GetCustomersUseCase,
    GetCustomerUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
  ],
  exports: [CUSTOMERS_REPOSITORY],
})
export class CustomersModule {}
