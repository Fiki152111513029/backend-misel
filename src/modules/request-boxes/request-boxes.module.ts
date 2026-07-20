import { Module } from '@nestjs/common';
import { RequestBoxController } from './controllers/request-box.controller';
import { REQUEST_BOXES_REPOSITORY } from './repositories/request-box-repository.interface';
import { RequestBoxRepository } from './repositories/request-box.repository';
import { CreateRequestBoxUseCase } from './use-cases/create-request-box.use-case';
import { DeleteRequestBoxUseCase } from './use-cases/delete-request-box.use-case';
import { GetRequestBoxesUseCase } from './use-cases/get-request-boxes.use-case';

@Module({
  controllers: [RequestBoxController],
  providers: [
    { provide: REQUEST_BOXES_REPOSITORY, useClass: RequestBoxRepository },
    CreateRequestBoxUseCase,
    GetRequestBoxesUseCase,
    DeleteRequestBoxUseCase,
  ],
  exports: [REQUEST_BOXES_REPOSITORY],
})
export class RequestBoxesModule {}
