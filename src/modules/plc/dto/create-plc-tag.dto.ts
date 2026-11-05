import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PlcDataType, PlcRegisterType, PlcWordOrder } from '@prisma/client';

const REGISTER_TYPES = Object.values(PlcRegisterType);
const DATA_TYPES = Object.values(PlcDataType);
const WORD_ORDERS = Object.values(PlcWordOrder);

export class CreatePlcTagDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  deviceId!: string;

  @ApiProperty({ example: 'Rack WRL31 full', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  // Zero-based protocol address. Tag lists are usually written in the
  // 4xxxx convention (40001 = holding register 0), so this is the number
  // with that offset already taken off — the single most common reason a
  // correctly connected device returns the wrong value.
  @ApiProperty({ example: 100, minimum: 0, maximum: 65535 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  address!: number;

  @ApiProperty({ enum: REGISTER_TYPES, example: PlcRegisterType.HOLDING_REGISTER })
  @IsIn(REGISTER_TYPES)
  registerType!: PlcRegisterType;

  @ApiPropertyOptional({ enum: DATA_TYPES, default: PlcDataType.UINT16 })
  @IsOptional()
  @IsIn(DATA_TYPES)
  dataType?: PlcDataType;

  @ApiPropertyOptional({ enum: WORD_ORDERS, default: PlcWordOrder.BIG })
  @IsOptional()
  @IsIn(WORD_ORDERS)
  wordOrder?: PlcWordOrder;

  @ApiPropertyOptional({
    example: 0.1,
    default: 1,
    description:
      'Multiplier for the raw value. A temperature stored as 235 reads 23.5 with a scale of 0.1.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  scale?: number;

  @ApiPropertyOptional({ example: 'pcs', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description:
      'Store changes in the history. Turn off for a value that moves on every poll, such as a running counter.',
  })
  @IsOptional()
  @IsBoolean()
  logEnabled?: boolean;
}
