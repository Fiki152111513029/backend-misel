import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { BinStatus } from '../use-cases/get-checking-area.use-case';

export class SetBinStatusDto {
  @ApiProperty({
    enum: ['EMPTY', 'FULL'],
    example: 'EMPTY',
    description:
      'What the bin actually is on the floor. Sent to RCS as nodeStatus 0 (empty) or 2 (full).',
  })
  @IsIn(['EMPTY', 'FULL'])
  status!: BinStatus;
}
