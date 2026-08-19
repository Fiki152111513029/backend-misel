import { Module } from '@nestjs/common';
import { TrolleysModule } from '../trolleys/trolleys.module';
import { WarehouseLocationsModule } from '../warehouse-locations/warehouse-locations.module';
import { ProductionLocationsModule } from '../production-locations/production-locations.module';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
import { TrolleyActivityController } from './controllers/trolley-activity.controller';
import { TROLLEY_ACTIVITIES_REPOSITORY } from './repositories/trolley-activity-repository.interface';
import { TrolleyActivityRepository } from './repositories/trolley-activity.repository';
import { LookupTrolleyUseCase } from './use-cases/lookup-trolley.use-case';
import { LookupLocationUseCase } from './use-cases/lookup-location.use-case';
import { CreateTrolleyActivityUseCase } from './use-cases/create-trolley-activity.use-case';
import { GetTrolleyActivitiesUseCase } from './use-cases/get-trolley-activities.use-case';
import { GetTrolleyActivitySequenceUseCase } from './use-cases/get-trolley-activity-sequence.use-case';
import { GetActiveTrolleyActivitiesByRobotUseCase } from './use-cases/get-active-trolley-activities-by-robot.use-case';

@Module({
  imports: [
    TrolleysModule,
    WarehouseLocationsModule,
    ProductionLocationsModule,
    UsersModule,
    TasksModule,
  ],
  controllers: [TrolleyActivityController],
  providers: [
    { provide: TROLLEY_ACTIVITIES_REPOSITORY, useClass: TrolleyActivityRepository },
    LookupTrolleyUseCase,
    LookupLocationUseCase,
    CreateTrolleyActivityUseCase,
    GetTrolleyActivitiesUseCase,
    GetTrolleyActivitySequenceUseCase,
    GetActiveTrolleyActivitiesByRobotUseCase,
  ],
  exports: [TROLLEY_ACTIVITIES_REPOSITORY],
})
export class TrolleyActivitiesModule {}
