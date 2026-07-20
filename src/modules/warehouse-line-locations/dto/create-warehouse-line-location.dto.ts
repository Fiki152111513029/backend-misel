import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWarehouseLineLocationDto {
  @ApiProperty({ example: 'Line 1', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'IRP-DROP-001', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  droppingLocationCode!: string;

  @ApiProperty({ example: 'IRP-PICK-001', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pickingLocationCode!: string;

  @ApiPropertyOptional({
    description: 'Model Code Process this line location is tied to for Warehouse Control cart releases',
    example: 'b3f1c2e4-...',
  })
  @IsOptional()
  @IsUUID()
  modelCodeProcessId?: string;
}
