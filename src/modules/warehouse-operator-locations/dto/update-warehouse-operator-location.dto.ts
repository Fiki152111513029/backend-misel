import { PartialType } from '@nestjs/swagger';
import { CreateWarehouseOperatorLocationDto } from './create-warehouse-operator-location.dto';

export class UpdateWarehouseOperatorLocationDto extends PartialType(
  CreateWarehouseOperatorLocationDto,
) {}
