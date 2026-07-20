import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWarehouseOperatorLocationDto {
  @ApiProperty({ example: 'Operator Point 1', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'IRP-OP-001', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  locationCode!: string;

  @ApiProperty({
    example: 'b3f1c2e4-...',
    description: 'User id (must have the Warehouse role)',
  })
  @IsUUID()
  operatorId!: string;
}
