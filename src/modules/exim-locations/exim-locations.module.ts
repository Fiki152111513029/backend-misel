import { Module } from '@nestjs/common';
import { EximLocationController } from './controllers/exim-location.controller';
import { EXIM_LOCATIONS_REPOSITORY } from './repositories/exim-location-repository.interface';
import { EximLocationRepository } from './repositories/exim-location.repository';
import { CreateEximLocationUseCase } from './use-cases/create-exim-location.use-case';
import { DeleteEximLocationUseCase } from './use-cases/delete-exim-location.use-case';
import { GetEximLocationUseCase } from './use-cases/get-exim-location.use-case';
import { GetEximLocationsUseCase } from './use-cases/get-exim-locations.use-case';
import { UpdateEximLocationUseCase } from './use-cases/update-exim-location.use-case';

@Module({
  controllers: [EximLocationController],
  providers: [
    { provide: EXIM_LOCATIONS_REPOSITORY, useClass: EximLocationRepository },
    CreateEximLocationUseCase,
    GetEximLocationsUseCase,
    GetEximLocationUseCase,
    UpdateEximLocationUseCase,
    DeleteEximLocationUseCase,
  ],
  exports: [EXIM_LOCATIONS_REPOSITORY],
})
export class EximLocationsModule {}
