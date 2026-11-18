import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TrolleyStatus } from '@prisma/client';

export class CreateTrolleyDto {
  @ApiProperty({ example: 'Trolley 1', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'TRL-001', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code!: string;

  @ApiPropertyOptional({ enum: TrolleyStatus, default: TrolleyStatus.EMPTY })
  @IsOptional()
  @IsEnum(TrolleyStatus)
  status?: TrolleyStatus;

  @ApiProperty({
    description:
      'Trolley Type id — name/code only need to be unique within this Type',
  })
  @IsNotEmpty()
  @IsUUID()
  trolleyTypeId!: string;

  @ApiPropertyOptional({ description: 'Trolley Category id' })
  @IsOptional()
  @IsUUID()
  trolleyCategoryId?: string;

  @ApiPropertyOptional({
    description:
      'Dropping Location Code — the Production Location this trolley drops off at (iRayple Location Code)',
  })
  @IsOptional()
  @IsString()
  droppingLocationCode?: string;

  @ApiPropertyOptional({
    description:
      'Transit Location Code — an optional stop between the scanned pickup and the Dropping Location, making a Warehouse Trolley Task a three-leg route. The AMR waits here until the Model Code Process timer continues it.',
  })
  // @IsOptional() skips both undefined and null, which is what is wanted:
  // undefined on a PATCH means "leave the stop alone", null means "remove
  // it". Typed to match, since that is the only way the form can turn a
  // three-leg route back into a two-leg one.
  @IsOptional()
  @IsString()
  transitLocationCode?: string | null;

  @ApiPropertyOptional({
    description:
      'Model Code Process id — used to build the RCS task-order payload when a Trolley Activity is submitted for this trolley',
  })
  @IsOptional()
  @IsUUID()
  modelCodeProcessId?: string;

  @ApiPropertyOptional({ description: 'Customer id' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
