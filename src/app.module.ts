import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { BoxTypesModule } from './modules/box-types/box-types.module';
import { ModelCodeProcessesModule } from './modules/model-code-processes/model-code-processes.module';
import { QuarantineLinesModule } from './modules/quarantine-lines/quarantine-lines.module';
import { QuarantineAreasModule } from './modules/quarantine-areas/quarantine-areas.module';
import { EximLocationsModule } from './modules/exim-locations/exim-locations.module';
import { EmptyPalletLocationsModule } from './modules/empty-pallet-locations/empty-pallet-locations.module';
import { WarehouseLineLocationsModule } from './modules/warehouse-line-locations/warehouse-line-locations.module';
import { WarehouseOperatorLocationsModule } from './modules/warehouse-operator-locations/warehouse-operator-locations.module';
import { ProductionLinesModule } from './modules/production-lines/production-lines.module';
import { ProductionLineAreasModule } from './modules/production-line-areas/production-line-areas.module';
import { RequestBoxesModule } from './modules/request-boxes/request-boxes.module';
import { RobotsModule } from './modules/robots/robots.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { WarehouseCartTasksModule } from './modules/warehouse-cart-tasks/warehouse-cart-tasks.module';
import { IcsLogsAccessModule } from './modules/ics-logs-access/ics-logs-access.module';
import { WebhookLogsModule } from './modules/webhook-logs/webhook-logs.module';
import { FactoryMapsModule } from './modules/factory-maps/factory-maps.module';
import { ChargerAreasModule } from './modules/charger-areas/charger-areas.module';
import { TrolleysModule } from './modules/trolleys/trolleys.module';
import { TrolleyCategoriesModule } from './modules/trolley-categories/trolley-categories.module';
import { WarehouseLocationsModule } from './modules/warehouse-locations/warehouse-locations.module';
import { ProductionLocationsModule } from './modules/production-locations/production-locations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    BoxTypesModule,
    ModelCodeProcessesModule,
    QuarantineLinesModule,
    QuarantineAreasModule,
    EximLocationsModule,
    EmptyPalletLocationsModule,
    WarehouseLineLocationsModule,
    WarehouseOperatorLocationsModule,
    ProductionLinesModule,
    ProductionLineAreasModule,
    RequestBoxesModule,
    RobotsModule,
    TasksModule,
    WarehouseCartTasksModule,
    IcsLogsAccessModule,
    WebhookLogsModule,
    FactoryMapsModule,
    ChargerAreasModule,
    TrolleysModule,
    TrolleyCategoriesModule,
    WarehouseLocationsModule,
    ProductionLocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
