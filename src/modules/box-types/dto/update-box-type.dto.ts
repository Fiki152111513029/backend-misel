import { PartialType } from '@nestjs/swagger';
import { CreateBoxTypeDto } from './create-box-type.dto';

export class UpdateBoxTypeDto extends PartialType(CreateBoxTypeDto) {}
