import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTrolleyActivityDto {
  @ApiProperty({ description: 'Trolley id, from the first (trolley) scan lookup' })
  @IsUUID()
  trolleyId!: string;

  @ApiProperty({ description: 'Pickup Location Code, from the second (location) scan lookup' })
  @IsString()
  @IsNotEmpty()
  pickupLocationCode!: string;

  @ApiProperty({ description: 'Timestamp of the first (trolley) scan — from the lookup-trolley response' })
  @IsDateString()
  startDate!: string;
}
