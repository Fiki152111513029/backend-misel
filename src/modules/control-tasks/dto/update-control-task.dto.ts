import { PartialType } from '@nestjs/swagger';
import { CreateControlTaskDto } from './create-control-task.dto';

export class UpdateControlTaskDto extends PartialType(CreateControlTaskDto) {}
