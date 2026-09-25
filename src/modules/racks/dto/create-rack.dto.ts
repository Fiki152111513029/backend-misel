import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RackStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRackDto {
  @ApiProperty({ example: 'Rack A1', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: RackStatus, default: RackStatus.EMPTY })
  @IsOptional()
  @IsEnum(RackStatus)
  status?: RackStatus;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
