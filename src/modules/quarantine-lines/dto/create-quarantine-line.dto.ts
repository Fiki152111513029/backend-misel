import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateQuarantineLineDto {
  @ApiProperty({ example: 'Line A', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Model Code Process used as this quarantine line\'s task template',
    example: 'b3f1c2e4-...',
  })
  @IsOptional()
  @IsUUID()
  modelCodeProcessId?: string;
}
