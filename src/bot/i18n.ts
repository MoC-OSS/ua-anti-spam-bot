/**
 * @module i18n
 * @description Configures grammyjs i18n plugin with Ukrainian as the default locale.
 * Also exports count constants used for randomizing obscene warning/delete messages.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { I18n } from '@grammyjs/i18n';

import type { GrammyContext } from '@app-types/context';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const i18n = new I18n<GrammyContext>({
  defaultLocale: 'uk',
  directory: path.resolve(__dirname, '..', 'locales'),
  // Always start with Ukrainian; the GlobalMiddleware overrides this with the
  // per-chat language stored in chatSession after sessions are loaded.
  localeNegotiator: () => 'uk',
});

/** Count constants for random message arrays */
export const WARN_OBSCENE_COUNT = 52;

export const DELETE_OBSCENE_COUNT = 41;

export const DELETE_ANTISEMITISM_COUNT = 49;

export const DELETE_DENYLIST_COUNT = 8;

export const ALARM_START_GENERIC_COUNT = 8;

export const ALARM_END_GENERIC_COUNT = 6;

export const ALARM_END_NIGHT_COUNT = 2;

export const ALARM_END_DAY_COUNT = 1;

/**
 * Get a random translated message from a numbered set of keys.
 * Keys must follow the pattern: `${prefix}-${index}` (1-based).
 * @param context - Grammy bot context used for translation.
 * @param prefix - The key prefix shared by all numbered translation variants.
 * @param count - The total number of variants available for the given prefix.
 * @returns A randomly selected translated string.
 */
export function getRandomT(context: GrammyContext, prefix: string, count: number): string {
  // eslint-disable-next-line sonarjs/pseudo-random
  const index = Math.floor(Math.random() * count) + 1;

  return context.t(`${prefix}-${index}`);
}
