import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { APP_SETTINGS_REPOSITORY } from '../repositories/app-setting-repository.interface';
import type { IAppSettingsRepository } from '../repositories/app-setting-repository.interface';
import { isAppSettingKey } from '../app-setting.keys';
import { RealtimeService } from '../../realtime/realtime.service';
import { GetAppSettingsUseCase } from './get-app-settings.use-case';

@Injectable()
export class UpdateAppSettingsUseCase {
  constructor(
    @Inject(APP_SETTINGS_REPOSITORY)
    private readonly appSettingsRepository: IAppSettingsRepository,
    private readonly getAppSettingsUseCase: GetAppSettingsUseCase,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(settings: Record<string, string>) {
    const entries = Object.entries(settings);

    // Rejected rather than ignored: a typo in a key would otherwise look
    // like a save that worked and changed nothing.
    const unknown = entries.filter(([key]) => !isAppSettingKey(key));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown setting(s): ${unknown.map(([key]) => key).join(', ')}`,
      );
    }

    const blank = entries.filter(([, value]) => !value?.trim());
    if (blank.length > 0) {
      throw new BadRequestException(
        `Setting(s) cannot be empty: ${blank.map(([key]) => key).join(', ')}`,
      );
    }

    await this.appSettingsRepository.upsertMany(
      entries.map(([key, value]) => ({ key, value: value.trim() })),
    );

    // Screens showing these words are already open on the floor; they
    // should not keep the old wording until someone reloads them.
    this.realtime.publish('settings');

    return this.getAppSettingsUseCase.execute();
  }
}
