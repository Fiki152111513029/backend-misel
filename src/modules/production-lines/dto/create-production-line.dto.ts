import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProductionLineDto {
  @ApiProperty({ example: 'Line 1', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  quarantineLineId!: string;

  @ApiProperty({ example: 'b3f1c2e4-...', description: 'User id' })
  @IsUUID()
  operatorId!: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
