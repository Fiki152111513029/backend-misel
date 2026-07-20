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
}
