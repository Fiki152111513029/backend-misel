import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AvailableOperatorsQueryDto {
  @ApiPropertyOptional({
    description:
      'Warehouse operator location id to exclude from the assigned-operator filter (used when editing a location so its current operator remains selectable)',
  })
  @IsOptional()
  @IsUUID()
  excludeId?: string;
}
