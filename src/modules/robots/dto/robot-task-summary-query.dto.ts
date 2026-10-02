import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import { AreaFilterQueryDto } from '../../../common/dto/area-filter-query.dto';

export class RobotTaskSummaryQueryDto extends AreaFilterQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-02',
    description:
      'Count only the tasks created on this calendar day (server local time), as YYYY-MM-DD. Omit for all time.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;
}
