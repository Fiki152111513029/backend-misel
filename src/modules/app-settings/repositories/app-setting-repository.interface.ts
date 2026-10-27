export const APP_SETTINGS_REPOSITORY = 'APP_SETTINGS_REPOSITORY';

export interface IAppSettingsRepository {
  /** Every stored override, as key -> value. Missing keys use their default. */
  findAll(): Promise<Map<string, string>>;
  /** Writes the given keys, leaving any not mentioned untouched. */
  upsertMany(entries: { key: string; value: string }[]): Promise<void>;
}
