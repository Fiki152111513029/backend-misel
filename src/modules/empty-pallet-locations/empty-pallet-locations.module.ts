import { Module } from '@nestjs/common';
import { EmptyPalletLocationController } from './controllers/empty-pallet-location.controller';
import { EMPTY_PALLET_LOCATIONS_REPOSITORY } from './repositories/empty-pallet-location-repository.interface';
import { EmptyPalletLocationRepository } from './repositories/empty-pallet-location.repository';
import { CreateEmptyPalletLocationUseCase } from './use-cases/create-empty-pallet-location.use-case';
import { DeleteEmptyPalletLocationUseCase } from './use-cases/delete-empty-pallet-location.use-case';
import { GetEmptyPalletLocationUseCase } from './use-cases/get-empty-pallet-location.use-case';
import { GetEmptyPalletLocationsUseCase } from './use-cases/get-empty-pallet-locations.use-case';
import { UpdateEmptyPalletLocationUseCase } from './use-cases/update-empty-pallet-location.use-case';

@Module({
  controllers: [EmptyPalletLocationController],
  providers: [
    {
      provide: EMPTY_PALLET_LOCATIONS_REPOSITORY,
      useClass: EmptyPalletLocationRepository,
    },
    CreateEmptyPalletLocationUseCase,
    GetEmptyPalletLocationsUseCase,
    GetEmptyPalletLocationUseCase,
    UpdateEmptyPalletLocationUseCase,
    DeleteEmptyPalletLocationUseCase,
  ],
  exports: [EMPTY_PALLET_LOCATIONS_REPOSITORY],
})
export class EmptyPalletLocationsModule {}
