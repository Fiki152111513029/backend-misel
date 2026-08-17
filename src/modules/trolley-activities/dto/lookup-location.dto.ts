import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LookupLocationDto {
  @ApiProperty({ example: 'IRP-WHL-001' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
