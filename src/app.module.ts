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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
