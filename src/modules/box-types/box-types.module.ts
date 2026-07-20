import { Module } from '@nestjs/common';
import { BoxTypeController } from './controllers/box-type.controller';
import { BOX_TYPES_REPOSITORY } from './repositories/box-type-repository.interface';
import { BoxTypeRepository } from './repositories/box-type.repository';
import { CreateBoxTypeUseCase } from './use-cases/create-box-type.use-case';
import { DeleteBoxTypeUseCase } from './use-cases/delete-box-type.use-case';
import { GetBoxTypeUseCase } from './use-cases/get-box-type.use-case';
import { GetBoxTypesUseCase } from './use-cases/get-box-types.use-case';
import { UpdateBoxTypeUseCase } from './use-cases/update-box-type.use-case';

@Module({
  controllers: [BoxTypeController],
  providers: [
    { provide: BOX_TYPES_REPOSITORY, useClass: BoxTypeRepository },
    CreateBoxTypeUseCase,
    GetBoxTypesUseCase,
    GetBoxTypeUseCase,
    UpdateBoxTypeUseCase,
    DeleteBoxTypeUseCase,
  ],
  exports: [BOX_TYPES_REPOSITORY],
})
export class BoxTypesModule {}
