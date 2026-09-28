import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsUUID, Matches } from 'class-validator';

export type TrolleyShiftMonthlyMode = 'AVERAGE' | 'TOTAL';

export class TrolleyShiftMonthlyQueryDto {
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
      'Shift id (see GET /shifts). Omit for every shift — the whole UTC day, with no assigned-shift filter on the operators — which is also the only option when no Shift has been configured.',
  })
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiProperty({
    enum: ['AVERAGE', 'TOTAL'],
    example: 'AVERAGE',
    description:
      'AVERAGE: mean per tracked day in the month. TOTAL: summed across the whole month.',
  })
  @IsIn(['AVERAGE', 'TOTAL'])
  mode!: TrolleyShiftMonthlyMode;
}
