import { PartialType } from '@nestjs/swagger';
import { CreateModelCodeProcessDto } from './create-model-code-process.dto';

export class UpdateModelCodeProcessDto extends PartialType(
  CreateModelCodeProcessDto,
) {}
