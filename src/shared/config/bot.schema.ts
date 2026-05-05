/**
 * @module bot.schema
 * @description Bot-process-specific environment validation.
 * Enforces that all variables required to run the Telegram bot are present and valid.
 * Supports smart conditional validation: variables for disabled integrations are skipped.
 */

import * as z from 'zod';

import type { EnvironmentConfig } from './env.schema';
import { validateGoogleCredentials } from './validate-google-credentials';

/**
 * Validates that the given parsed config satisfies all bot-process requirements.
 * Reports every issue at once so developers can fix all problems in a single pass.
 * @param config - The parsed (type-safe) environment config.
 * @throws {z.ZodError} When one or more required variables are missing or invalid.
 */
export function validateBotEnvironment(config: EnvironmentConfig): void {
  const validationSchema = z.object({}).superRefine((_value, context) => {
    // ── Core bot variables ──────────────────────────────────────────────
    if (!config.BOT_TOKEN) {
      context.addIssue({
        code: 'custom',
        path: ['BOT_TOKEN'],
        message: 'Required. Create a bot via @BotFather and paste the token here.',
      });
    }

    // ── Google API (conditional) ────────────────────────────────────────
    if (!config.DISABLE_GOOGLE_API) {
      if (config.GOOGLE_CREDITS) {
        validateGoogleCredentials(config.GOOGLE_CREDITS, context);
      } else {
        context.addIssue({
          code: 'custom',
          path: ['GOOGLE_CREDITS'],
          message: 'Required when DISABLE_GOOGLE_API is not true. Provide a Google service account JSON credential string.',
        });
      }

      if (!config.GOOGLE_SPREADSHEET_ID) {
        context.addIssue({
          code: 'custom',
          path: ['GOOGLE_SPREADSHEET_ID'],
          message: 'Required when DISABLE_GOOGLE_API is not true. Provide the spreadsheet ID from the sheet URL.',
        });
      }
    }

    // ── Alarm API (conditional) ─────────────────────────────────────────
    if (!config.DISABLE_ALARM_API && !config.ALARM_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['ALARM_KEY'],
        message: 'Required when DISABLE_ALARM_API is not true. Obtain from Stfalcon (api.ukrainealarm.com).',
      });
    }
  });

  validationSchema.parse({});
}
