import { Module } from '@nestjs/common';
import { IcsLogsAccessController } from './controllers/ics-logs-access.controller';
import { VerifyIcsLogsPasswordUseCase } from './use-cases/verify-ics-logs-password.use-case';

@Module({
  controllers: [IcsLogsAccessController],
  providers: [VerifyIcsLogsPasswordUseCase],
})
export class IcsLogsAccessModule {}
