import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePlcTagDto } from './create-plc-tag.dto';

// deviceId is left out: moving a tag to another device would silently
// change what its history means, so it is created again instead.
export class UpdatePlcTagDto extends PartialType(
  OmitType(CreatePlcTagDto, ['deviceId'] as const),
) {}
