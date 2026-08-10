import { PartialType } from '@nestjs/swagger';
import { CreateChargerAreaDto } from './create-charger-area.dto';

export class UpdateChargerAreaDto extends PartialType(CreateChargerAreaDto) {}
