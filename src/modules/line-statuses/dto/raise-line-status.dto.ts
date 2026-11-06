import { ApiProperty } from '@nestjs/swagger';
import { LineStatusKind } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RaiseLineStatusDto {
  @ApiProperty({
    example: 'WRL31',
    description:
      'The Control Task group this line is known by. Must be a group the caller actually has a task in, and one with the line-status buttons switched on.',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  groupName!: string;

  @ApiProperty({ enum: LineStatusKind, example: LineStatusKind.RUNNING_LH })
  @IsEnum(LineStatusKind)
  kind!: LineStatusKind;
}
