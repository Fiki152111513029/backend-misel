import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class TakeTrolleyDto {
  @ApiProperty({ description: 'Trolley id, from the first (trolley) scan lookup' })
  @IsUUID()
  trolleyId!: string;

  @ApiProperty({ description: 'Pickup Location Code, from the second (area) scan lookup' })
  @IsString()
  @IsNotEmpty()
  pickupLocationCode!: string;

  @ApiProperty({
    description:
      'Which page the operator is on ("Warehouse" or "Operator" Trolley Task) — recorded on the open Trolley Activity row this creates, same meaning as CreateTrolleyActivityDto.queueRole',
    enum: ['Warehouse', 'Operator'],
  })
  @IsIn(['Warehouse', 'Operator'])
  queueRole!: 'Warehouse' | 'Operator';
}
