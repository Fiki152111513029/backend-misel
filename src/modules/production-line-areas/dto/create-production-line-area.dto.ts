import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionLineAreaType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductionLineAreaDto {
  @ApiProperty({ example: 'Area A1', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    enum: ProductionLineAreaType,
    example: ProductionLineAreaType.PRODUCTION,
  })
  @IsEnum(ProductionLineAreaType)
  type!: ProductionLineAreaType;

  @ApiProperty({ example: 'IRP-PLA-001', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  iRaypleLocationCode!: string;

  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  productionLineId!: string;

  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  eximLocationId!: string;

  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  emptyPalletLocationId!: string;

  @ApiPropertyOptional({
    description: 'Model Code Process used as this area\'s task template when releasing tasks',
    example: 'b3f1c2e4-...',
  })
  @IsOptional()
  @IsUUID()
  modelCodeProcessId?: string;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsInt()
  @Min(0)
  order!: number;
}
