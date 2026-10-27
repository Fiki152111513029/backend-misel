import { Inject, Injectable } from '@nestjs/common';
import { APP_SETTINGS_REPOSITORY } from '../repositories/app-setting-repository.interface';
import type { IAppSettingsRepository } from '../repositories/app-setting-repository.interface';
import {
  APP_SETTING_DEFAULTS,
  APP_SETTING_KEYS,
  AppSettingKey,
} from '../app-setting.keys';

@Injectable()
export class GetAppSettingsUseCase {
  constructor(
    @Inject(APP_SETTINGS_REPOSITORY)
    private readonly appSettingsRepository: IAppSettingsRepository,
  ) {}

  /**
   * Always returns every known key, falling back to its default.
   *
   * Callers never have to handle a missing setting, so a key added later
   * cannot blank out a label on screens running older data.
   */
  async execute(): Promise<Record<AppSettingKey, string>> {
    const stored = await this.appSettingsRepository.findAll();
    const result = {} as Record<AppSettingKey, string>;
    for (const key of APP_SETTING_KEYS) {
      const value = stored.get(key)?.trim();
      result[key] = value || APP_SETTING_DEFAULTS[key];
    }
    return result;
  }
}
