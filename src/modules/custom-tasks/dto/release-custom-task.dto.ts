import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReleaseCustomTaskDto {
  @ApiProperty({
    example: 'A',
    maxLength: 20,
    description: 'The code scanned from the Control Task QR label',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;
}
