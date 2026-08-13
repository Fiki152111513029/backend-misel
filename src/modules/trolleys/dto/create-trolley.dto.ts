import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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
}
