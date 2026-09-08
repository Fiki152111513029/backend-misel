import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CreateCustomerUseCase } from '../use-cases/create-customer.use-case';
import { DeleteCustomerUseCase } from '../use-cases/delete-customer.use-case';
import { GetCustomerUseCase } from '../use-cases/get-customer.use-case';
import { GetCustomersUseCase } from '../use-cases/get-customers.use-case';
import { UpdateCustomerUseCase } from '../use-cases/update-customer.use-case';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly getCustomersUseCase: GetCustomersUseCase,
    private readonly getCustomerUseCase: GetCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
  ) {}

  @Post()
  @Permissions('customer.create')
  @ApiOperation({ summary: 'Create a new customer' })
  async create(@Body() dto: CreateCustomerDto) {
    const data = await this.createCustomerUseCase.execute(dto);
    return { success: true, message: 'Customer created successfully', data };
  }

  @Get()
  @Permissions('customer.read')
  @ApiOperation({
    summary: 'List customers (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: CustomerQueryDto) {
    const data = await this.getCustomersUseCase.execute(query);
    return { success: true, message: 'Customers retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('customer.read')
  @ApiOperation({ summary: 'Get a customer by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getCustomerUseCase.execute(id);
    return { success: true, message: 'Customer retrieved successfully', data };
  }

  @Put(':id')
  @Permissions('customer.update')
  @ApiOperation({ summary: 'Update a customer' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const data = await this.updateCustomerUseCase.execute(id, dto);
    return { success: true, message: 'Customer updated successfully', data };
  }

  @Delete(':id')
  @Permissions('customer.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a customer' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteCustomerUseCase.execute(id);
    return {
      success: true,
      message: 'Customer deleted successfully',
      data: null,
    };
  }
}
