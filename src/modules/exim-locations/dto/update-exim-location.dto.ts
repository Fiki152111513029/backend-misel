import { PartialType } from '@nestjs/swagger';
import { CreateEximLocationDto } from './create-exim-location.dto';

export class UpdateEximLocationDto extends PartialType(CreateEximLocationDto) {}
