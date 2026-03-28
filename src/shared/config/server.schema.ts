/**
 * @module server.schema
 * @description Server-process-specific environment validation.
 * Enforces that all variables required to run the Express ML server are present and valid.
 * Supports smart conditional validation: variables for disabled integrations are skipped.
 */

import crypto from 'node:crypto';

import * as z from 'zod';

import type { EnvironmentConfig } from './env.schema';
import { validateGoogleCredentials } from './validate-google-credentials';

/**
 * Validates that the given parsed config satisfies all server-process requirements.
 * Reports every issue at once so developers can fix all problems in a single pass.
 * @param config - The parsed (type-safe) environment config.
 * @throws {z.ZodError} When one or more required variables are missing or invalid.
 */
export function validateServerEnvironment(config: EnvironmentConfig): void {
  const validationSchema = z.object({}).superRefine((_value, context) => {
    // ── Core bot token (needed for API calls from server) ───────────────
    if (!config.BOT_TOKEN) {
      context.addIssue({
        code: 'custom',
        path: ['BOT_TOKEN'],
        message: 'Required. The server needs BOT_TOKEN to interact with the Telegram API.',
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
    if (!config.DISABLE_ALARM_API) {
      if (!config.ALARM_KEY) {
        context.addIssue({
          code: 'custom',
          path: ['ALARM_KEY'],
          message: 'Required when DISABLE_ALARM_API is not true. Obtain from Stfalcon (api.ukrainealarm.com).',
        });
      }

      // Validate PEM format if provided
      if (config.ALARM_WEBHOOK_PUBLIC_KEY_PEM) {
        try {
          crypto.createPublicKey(config.ALARM_WEBHOOK_PUBLIC_KEY_PEM);
        } catch {
          context.addIssue({
            code: 'custom',
            path: ['ALARM_WEBHOOK_PUBLIC_KEY_PEM'],
            message:
              'Value is set but not a valid PEM public key. ' +
              'Ensure newlines are preserved (not replaced with spaces). ' +
              'Download the correct key from the Stfalcon API docs.',
          });
        }
      }
    }
  });

  validationSchema.parse({});
}
