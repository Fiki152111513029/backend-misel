import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FromSystem } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateModelCodeProcessDto {
  @ApiProperty({ example: 'Model A', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: FromSystem, example: FromSystem.MES })
  @IsEnum(FromSystem)
  fromSystem!: FromSystem;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Status 1 comment shown to Operator and Admin', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  statusComment1?: string;

  @ApiPropertyOptional({ description: 'Status 2 comment shown to Operator and Admin', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  statusComment2?: string;

  @ApiPropertyOptional({ description: 'Status 3 comment shown to Operator and Admin', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  statusComment3?: string;

  @ApiPropertyOptional({ description: 'Status 4 comment shown to Operator and Admin', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  statusComment4?: string;

  @ApiPropertyOptional({ description: 'Status 5 comment shown to Operator and Admin', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  statusComment5?: string;

  @ApiPropertyOptional({ description: 'Status 6 comment shown to Operator and Admin', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  statusComment6?: string;

  @ApiPropertyOptional({ description: 'Status 7 comment shown to Operator and Admin', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  statusComment7?: string;

  @ApiPropertyOptional({ description: 'Status 8 comment shown to Operator and Admin', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  statusComment8?: string;
}
