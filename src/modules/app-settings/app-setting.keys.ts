/**
 * Every setting an admin may change, with the value used until they do.
 *
 * A closed list rather than free-form keys: the UI has to know what to
 * offer, and an unknown key silently doing nothing is worse than being
 * rejected. Adding one here is all it takes — no migration.
 */
export const APP_SETTING_DEFAULTS = {
  /**
   * What a bin holding a rack is called on screen.
   *
   * RCS calls it "full" (nodeStatus 2), but on the floor that means an
   * empty rack is standing there ready to be collected — so the literal
   * translation reads as the opposite of what it means.
   */
  'bin.label.full': 'Rak Kosong Ready',
  /** A bin with no rack on it (nodeStatus 0, nothing recorded on it). */
  'bin.label.empty': 'Rak Kosong Belum Ready',
  /**
   * A bin an AMR has delivered finished goods to.
   *
   * RCS reports it as 0 like an empty one, so this label is the only thing
   * separating them on screen — see WarehouseBinContent in the schema.
   */
  'bin.label.finishGood': 'Finish Good Ready',
} as const;

export type AppSettingKey = keyof typeof APP_SETTING_DEFAULTS;

export const APP_SETTING_KEYS = Object.keys(
  APP_SETTING_DEFAULTS,
) as AppSettingKey[];

export function isAppSettingKey(key: string): key is AppSettingKey {
  return key in APP_SETTING_DEFAULTS;
}
