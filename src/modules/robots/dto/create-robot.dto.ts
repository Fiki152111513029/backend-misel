import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRobotDto {
  @ApiProperty({ example: 'V3-Titan', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'AMR-V3-X8922', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  amrDeviceSerialNo!: string;

  @ApiProperty({ example: 'DEV-001', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  amrDeviceNo!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  areaId!: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
