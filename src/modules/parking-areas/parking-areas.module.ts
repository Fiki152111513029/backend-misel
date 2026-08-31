import { Module } from '@nestjs/common';
import { ParkingAreaController } from './controllers/parking-area.controller';
import { PARKING_AREAS_REPOSITORY } from './repositories/parking-area-repository.interface';
import { ParkingAreaRepository } from './repositories/parking-area.repository';
import { CreateParkingAreaUseCase } from './use-cases/create-parking-area.use-case';
import { DeleteParkingAreaUseCase } from './use-cases/delete-parking-area.use-case';
import { GetParkingAreaUseCase } from './use-cases/get-parking-area.use-case';
import { GetParkingAreasUseCase } from './use-cases/get-parking-areas.use-case';
import { UpdateParkingAreaUseCase } from './use-cases/update-parking-area.use-case';

@Module({
  controllers: [ParkingAreaController],
  providers: [
    { provide: PARKING_AREAS_REPOSITORY, useClass: ParkingAreaRepository },
    CreateParkingAreaUseCase,
    GetParkingAreasUseCase,
    GetParkingAreaUseCase,
    UpdateParkingAreaUseCase,
    DeleteParkingAreaUseCase,
  ],
  exports: [PARKING_AREAS_REPOSITORY],
})
export class ParkingAreasModule {}
