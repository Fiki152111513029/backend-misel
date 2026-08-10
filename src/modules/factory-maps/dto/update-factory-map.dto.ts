import { PartialType } from '@nestjs/swagger';
import { CreateFactoryMapDto } from './create-factory-map.dto';

export class UpdateFactoryMapDto extends PartialType(CreateFactoryMapDto) {}
