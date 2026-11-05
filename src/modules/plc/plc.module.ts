import { Module } from '@nestjs/common';
import { PlcController } from './controllers/plc.controller';
import { PLC_REPOSITORY } from './repositories/plc-repository.interface';
import { PlcRepository } from './repositories/plc.repository';
import { PlcConnectionService } from './services/plc-connection.service';
import { PlcPollerService } from './services/plc-poller.service';
import { PlcValueCacheService } from './services/plc-value-cache.service';
import {
  CreatePlcDeviceUseCase,
  DeletePlcDeviceUseCase,
  GetPlcDeviceUseCase,
  GetPlcDevicesUseCase,
  TestPlcDeviceUseCase,
  UpdatePlcDeviceUseCase,
} from './use-cases/plc-device.use-cases';
import {
  CreatePlcTagUseCase,
  DeletePlcTagUseCase,
  GetPlcLiveUseCase,
  GetPlcReadingsUseCase,
  GetPlcTagsUseCase,
  UpdatePlcTagUseCase,
} from './use-cases/plc-tag.use-cases';

/**
 * Reads PLCs over Modbus TCP and pushes what they say to the dashboard.
 *
 * RealtimeModule is global, so it is not imported here — see AppModule.
 */
@Module({
  controllers: [PlcController],
  providers: [
    { provide: PLC_REPOSITORY, useClass: PlcRepository },
    PlcConnectionService,
    PlcValueCacheService,
    PlcPollerService,
    GetPlcDevicesUseCase,
    GetPlcDeviceUseCase,
    CreatePlcDeviceUseCase,
    UpdatePlcDeviceUseCase,
    DeletePlcDeviceUseCase,
    TestPlcDeviceUseCase,
    GetPlcTagsUseCase,
    CreatePlcTagUseCase,
    UpdatePlcTagUseCase,
    DeletePlcTagUseCase,
    GetPlcLiveUseCase,
    GetPlcReadingsUseCase,
  ],
  exports: [PLC_REPOSITORY, PlcValueCacheService],
})
export class PlcModule {}
