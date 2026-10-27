import { Module } from '@nestjs/common';
import { AppSettingController } from './controllers/app-setting.controller';
import { APP_SETTINGS_REPOSITORY } from './repositories/app-setting-repository.interface';
import { AppSettingRepository } from './repositories/app-setting.repository';
import { GetAppSettingsUseCase } from './use-cases/get-app-settings.use-case';
import { UpdateAppSettingsUseCase } from './use-cases/update-app-settings.use-case';

// Wording the floor can change without a deploy — see app-setting.keys.ts.
@Module({
  controllers: [AppSettingController],
  providers: [
    { provide: APP_SETTINGS_REPOSITORY, useClass: AppSettingRepository },
    GetAppSettingsUseCase,
    UpdateAppSettingsUseCase,
  ],
  exports: [GetAppSettingsUseCase],
})
export class AppSettingsModule {}
