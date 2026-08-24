import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTrolleyCategoryDto {
  @ApiProperty({ example: 'Heavy Duty', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description:
      'Model Code Process id — used to build the RCS task-order payload for Trolley Activities whose trolley belongs to this category',
  })
  @IsOptional()
  @IsUUID()
  modelCodeProcessId?: string;
}
