import { PartialType } from '@nestjs/swagger';
import { CreateWarehouseLineLocationDto } from './create-warehouse-line-location.dto';

export class UpdateWarehouseLineLocationDto extends PartialType(
  CreateWarehouseLineLocationDto,
) {}
