import { Module } from '@nestjs/common';
import { ControlTasksModule } from '../control-tasks/control-tasks.module';
import { LineStatusController } from './controllers/line-status.controller';
import { LINE_STATUSES_REPOSITORY } from './repositories/line-status-repository.interface';
import { LineStatusRepository } from './repositories/line-status.repository';
import { ClearLineStatusUseCase } from './use-cases/clear-line-status.use-case';
import { GetLineStatusesUseCase } from './use-cases/get-line-statuses.use-case';
import { RaiseLineStatusUseCase } from './use-cases/raise-line-status.use-case';

// The four buttons a registered Control Task group shows at the foot of
// Custom Task, and the board they feed in Checking Area. ControlTasksModule
// is imported for its repository only — to check that the caller really
// works the line they are announcing for.
@Module({
  imports: [ControlTasksModule],
  controllers: [LineStatusController],
  providers: [
    { provide: LINE_STATUSES_REPOSITORY, useClass: LineStatusRepository },
    GetLineStatusesUseCase,
    RaiseLineStatusUseCase,
    ClearLineStatusUseCase,
  ],
})
export class LineStatusesModule {}
