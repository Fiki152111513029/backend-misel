import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FactoryMapQueryDto {
  @ApiPropertyOptional({
    example: 2,
    minimum: 1,
    description: 'Defaults to TASK_ORDER_AREA_ID if omitted',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  areaId?: number;
}
