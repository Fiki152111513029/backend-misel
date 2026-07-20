import { PartialType } from '@nestjs/swagger';
import { CreateQuarantineLineDto } from './create-quarantine-line.dto';

export class UpdateQuarantineLineDto extends PartialType(
  CreateQuarantineLineDto,
) {}
