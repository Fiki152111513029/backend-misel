import { ApiProperty } from '@nestjs/swagger';
import type { ControlTaskWithRelations } from '../repositories/control-task-repository.interface';

export class ControlTaskEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'A' })
  abjad!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  modelCodeProcessId!: string;

  @ApiProperty({ type: [String], example: ['L3CPA', 'FGA', 'EPA', 'L3CPA'] })
  route!: string[];

  @ApiProperty({
    example: 'L3CPA,FGA,EPA,L3CPA',
    description:
      'The route joined for the RCS task order — derived, never stored',
  })
  taskPath!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}

/**
 * Adds the derived `taskPath` (the route joined with ",", the exact shape the
 * RCS task-order payload expects — see docs/feature.md) so every caller reads
 * it the same way instead of re-joining the array itself.
 */
export function toControlTaskResponse(task: ControlTaskWithRelations) {
  return { ...task, taskPath: task.route.join(',') };
}
