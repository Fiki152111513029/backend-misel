import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTrolleyActivityDto {
  @ApiProperty({
    description: 'Trolley id, from the first (trolley) scan lookup',
  })
  @IsUUID()
  trolleyId!: string;

  @ApiProperty({
    description: 'Pickup Location Code, from the second (location) scan lookup',
  })
  @IsString()
  @IsNotEmpty()
  pickupLocationCode!: string;

  @ApiProperty({
    description:
      'Timestamp of the first (trolley) scan — from the lookup-trolley response',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description:
      'Which page the operator is on ("Warehouse" or "Operator" Trolley Task) — routes the Current Queue card back to that same page, independent of the pickup/dropping direction this submission turns out to be',
    enum: ['Warehouse', 'Operator'],
  })
  @IsIn(['Warehouse', 'Operator'])
  queueRole!: 'Warehouse' | 'Operator';
}
