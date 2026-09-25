import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeOfGoods } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateControlTaskDto {
  @ApiProperty({ example: 'A', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  abjad!: string;

  @ApiProperty({ example: 'Supply Line 3 — Pallet', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: TypeOfGoods })
  @IsEnum(TypeOfGoods)
  typeOfGoods!: TypeOfGoods;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  modelCodeProcessId!: string;

  // Ordered, and duplicates are intentional — a route may revisit a code it
  // has already been to (L3CPA,FGA,EPA,L3CPA). There is no upper bound on
  // how many legs an operator can chain.
  @ApiProperty({ type: [String], example: ['L3CPA', 'FGA', 'EPA', 'L3CPA'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  route!: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
