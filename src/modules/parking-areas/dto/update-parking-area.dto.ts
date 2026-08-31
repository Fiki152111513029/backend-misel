import { PartialType } from '@nestjs/swagger';
import { CreateParkingAreaDto } from './create-parking-area.dto';

export class UpdateParkingAreaDto extends PartialType(CreateParkingAreaDto) {}
