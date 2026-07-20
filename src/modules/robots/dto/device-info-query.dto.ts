import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class DeviceInfoQueryDto {
  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  areaId!: number;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  deviceType?: string;
}
