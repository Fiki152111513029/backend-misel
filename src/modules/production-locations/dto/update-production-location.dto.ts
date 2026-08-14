import { PartialType } from '@nestjs/swagger';
import { CreateProductionLocationDto } from './create-production-location.dto';

export class UpdateProductionLocationDto extends PartialType(
  CreateProductionLocationDto,
) {}
