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
      'Model Code Process id — used to build the RCS task-order payload when a Trolley Activity is submitted for this trolley',
  })
  @IsOptional()
  @IsUUID()
  modelCodeProcessId?: string;
}
