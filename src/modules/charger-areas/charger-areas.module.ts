import { Module } from '@nestjs/common';
import { ChargerAreaController } from './controllers/charger-area.controller';
import { CHARGER_AREAS_REPOSITORY } from './repositories/charger-area-repository.interface';
import { ChargerAreaRepository } from './repositories/charger-area.repository';
import { CreateChargerAreaUseCase } from './use-cases/create-charger-area.use-case';
import { DeleteChargerAreaUseCase } from './use-cases/delete-charger-area.use-case';
import { GetChargerAreaUseCase } from './use-cases/get-charger-area.use-case';
import { GetChargerAreasUseCase } from './use-cases/get-charger-areas.use-case';
import { UpdateChargerAreaUseCase } from './use-cases/update-charger-area.use-case';

@Module({
  controllers: [ChargerAreaController],
  providers: [
    { provide: CHARGER_AREAS_REPOSITORY, useClass: ChargerAreaRepository },
    CreateChargerAreaUseCase,
    GetChargerAreasUseCase,
    GetChargerAreaUseCase,
    UpdateChargerAreaUseCase,
    DeleteChargerAreaUseCase,
  ],
  exports: [CHARGER_AREAS_REPOSITORY],
})
export class ChargerAreasModule {}
