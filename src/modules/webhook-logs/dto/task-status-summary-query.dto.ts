import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import { AreaFilterQueryDto } from '../../../common/dto/area-filter-query.dto';

export class TaskStatusSummaryQueryDto extends AreaFilterQueryDto {
  @ApiPropertyOptional({
    example: '2026-09-28',
    description:
      'Calendar day (server local time) to summarize, as YYYY-MM-DD. Defaults to today.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;
}
