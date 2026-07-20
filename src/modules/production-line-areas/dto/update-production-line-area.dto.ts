import { PartialType } from '@nestjs/swagger';
import { CreateProductionLineAreaDto } from './create-production-line-area.dto';

export class UpdateProductionLineAreaDto extends PartialType(
  CreateProductionLineAreaDto,
) {}
