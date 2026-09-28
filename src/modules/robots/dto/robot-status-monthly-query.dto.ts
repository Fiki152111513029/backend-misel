import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsUUID, Matches } from 'class-validator';
import { AreaFilterQueryDto } from '../../../common/dto/area-filter-query.dto';

export type RobotStatusMonthlyMode = 'AVERAGE' | 'TOTAL';

export class RobotStatusMonthlyQueryDto extends AreaFilterQueryDto {
  @ApiProperty({
    example: '2026-05',
    description: 'Calendar month (UTC) to summarize, as YYYY-MM',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month!: string;

  @ApiPropertyOptional({
    example: 'b3f1c2e4-...',
    description:
      'Shift id (see GET /shifts). Omit for every shift, which is also the only option when no Shift has been configured.',
  })
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiProperty({
    enum: ['AVERAGE', 'TOTAL'],
    example: 'AVERAGE',
    description:
      'AVERAGE: mean minutes per tracked day in the month. TOTAL: summed minutes across the whole month.',
  })
  @IsIn(['AVERAGE', 'TOTAL'])
  mode!: RobotStatusMonthlyMode;
}
