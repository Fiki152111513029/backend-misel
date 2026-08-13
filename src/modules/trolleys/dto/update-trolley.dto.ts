import { PartialType } from '@nestjs/swagger';
import { CreateTrolleyDto } from './create-trolley.dto';

export class UpdateTrolleyDto extends PartialType(CreateTrolleyDto) {}
