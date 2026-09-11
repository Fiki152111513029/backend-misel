import { PartialType } from '@nestjs/swagger';
import { CreateTrolleyTypeDto } from './create-trolley-type.dto';

export class UpdateTrolleyTypeDto extends PartialType(CreateTrolleyTypeDto) {}
