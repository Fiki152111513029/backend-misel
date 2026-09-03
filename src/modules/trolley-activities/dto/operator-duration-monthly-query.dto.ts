import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { TrolleyShiftMonthlyQueryDto } from './trolley-shift-monthly-query.dto';
import type { PickupDirection } from '../utils/trolley-shift-summary.util';

export class OperatorDurationMonthlyQueryDto extends TrolleyShiftMonthlyQueryDto {
  @ApiProperty({
    enum: ['WAREHOUSE', 'PRODUCTION'],
    example: 'WAREHOUSE',
    description:
      'WAREHOUSE: pickup scanned from a Warehouse Location ("Dealer Operator", Warehouse -> Production). PRODUCTION: pickup scanned from a Production Location ("Supply Operator", Production -> Warehouse).',
  })
  @IsIn(['WAREHOUSE', 'PRODUCTION'])
  direction!: PickupDirection;
}
