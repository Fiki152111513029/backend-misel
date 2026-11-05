import { PartialType } from '@nestjs/swagger';
import { CreatePlcDeviceDto } from './create-plc-device.dto';

export class UpdatePlcDeviceDto extends PartialType(CreatePlcDeviceDto) {}
