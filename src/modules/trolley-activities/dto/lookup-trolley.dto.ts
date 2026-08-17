import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LookupTrolleyDto {
  @ApiProperty({ example: 'TRL-001' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
