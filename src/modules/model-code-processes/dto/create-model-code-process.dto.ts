import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FromSystem } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
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

  @ApiPropertyOptional({
    description:
      'Seconds to wait before a task on this Model Code Process is continued automatically. Null or omitted means no timer — nothing is continued on its own.',
    minimum: 1,
    maximum: 86400,
    nullable: true,
    example: 30,
  })
  // @IsOptional() skips both undefined and null, which is exactly what is
  // wanted here: undefined on a PATCH means "leave it alone", null means
  // "clear the timer", and neither should be validated as a number.
  @IsOptional()
  @IsInt()
  // 1, not 0. A 0-second timer and no timer at all would be
  // indistinguishable, and null already says "no timer".
  @Min(1)
  // 24 hours. Nothing on this floor legitimately waits longer, so a value
  // above it is a typo — almost always milliseconds typed into a seconds
  // field, which would otherwise silently become a 20-minute wait.
  @Max(86400)
  continueTaskDelaySec?: number | null;
}
