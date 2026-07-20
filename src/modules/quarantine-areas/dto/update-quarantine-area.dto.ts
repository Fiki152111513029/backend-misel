import { PartialType } from '@nestjs/swagger';
import { CreateQuarantineAreaDto } from './create-quarantine-area.dto';

export class UpdateQuarantineAreaDto extends PartialType(
  CreateQuarantineAreaDto,
) {}
