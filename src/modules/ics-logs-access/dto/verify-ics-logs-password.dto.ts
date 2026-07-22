import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyIcsLogsPasswordDto {
  @ApiProperty({ example: 'IcsDev123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
