import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class TakeTrolleyDto {
  @ApiProperty({ description: 'Trolley id, from the first (trolley) scan lookup' })
  @IsUUID()
  trolleyId!: string;

  @ApiProperty({ description: 'Pickup Location Code, from the second (area) scan lookup' })
  @IsString()
  @IsNotEmpty()
  pickupLocationCode!: string;
}
