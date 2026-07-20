import { PartialType } from '@nestjs/swagger';
import { CreateEmptyPalletLocationDto } from './create-empty-pallet-location.dto';

export class UpdateEmptyPalletLocationDto extends PartialType(
  CreateEmptyPalletLocationDto,
) {}
