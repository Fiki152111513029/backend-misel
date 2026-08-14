import { PartialType } from '@nestjs/swagger';
import { CreateTrolleyCategoryDto } from './create-trolley-category.dto';

export class UpdateTrolleyCategoryDto extends PartialType(
  CreateTrolleyCategoryDto,
) {}
