import { Module } from '@nestjs/common';
import { RobotController } from './controllers/robot.controller';
import { ROBOTS_REPOSITORY } from './repositories/robot-repository.interface';
import { RobotRepository } from './repositories/robot.repository';
import { CreateRobotUseCase } from './use-cases/create-robot.use-case';
import { DeleteRobotUseCase } from './use-cases/delete-robot.use-case';
import { GetRobotUseCase } from './use-cases/get-robot.use-case';
import { GetRobotsUseCase } from './use-cases/get-robots.use-case';
import { UpdateRobotUseCase } from './use-cases/update-robot.use-case';
import { RobotTelemetryService } from './services/robot-telemetry.service';

@Module({
  controllers: [RobotController],
  providers: [
    { provide: ROBOTS_REPOSITORY, useClass: RobotRepository },
    RobotTelemetryService,
    CreateRobotUseCase,
    GetRobotsUseCase,
    GetRobotUseCase,
    UpdateRobotUseCase,
    DeleteRobotUseCase,
  ],
  exports: [ROBOTS_REPOSITORY],
})
export class RobotsModule {}
