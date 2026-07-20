import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateQuarantineAreaDto {
  @ApiProperty({ example: 'Area A1', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'IRP-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  iRaypleLocationCode!: string;

  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  quarantineLineId!: string;
}
