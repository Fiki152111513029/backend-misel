import { ApiProperty } from '@nestjs/swagger';
import { TaskAction } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class ReleaseTaskDto {
  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  productionLineAreaId!: string;

  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  boxTypeId!: string;

  @ApiProperty({ enum: TaskAction, example: TaskAction.AMBIL_FG })
  @IsEnum(TaskAction)
  taskAction!: TaskAction;
}
