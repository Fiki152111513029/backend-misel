import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
  code!: string;

  @ApiProperty({ example: 'Supply Line 3 — Pallet', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

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

  // Who may dispatch this from Custom Task. Optional and may be empty: a
  // task with nobody assigned is still reachable by scanning its QR label,
  // it just does not appear in anyone's picker.
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
