/**
 * @module validate-google-credentials
 * @description Validates the GOOGLE_CREDITS env variable: checks that it is valid JSON
 * and that the embedded `private_key` field is a parseable PEM private key.
 */

import crypto from 'node:crypto';

import type * as z from 'zod';

/**
 * Validates `GOOGLE_CREDITS` as JSON with a valid `private_key` PEM field.
 * Adds Zod issues to the refinement context when validation fails.
 * @param googleCredentials - The raw GOOGLE_CREDITS string value.
 * @param context - The Zod superRefine context to add issues to.
 */
export function validateGoogleCredentials(googleCredentials: string, context: z.RefinementCtx): void {
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(googleCredentials) as Record<string, unknown>;
  } catch {
    context.addIssue({
      code: 'custom',
      path: ['GOOGLE_CREDITS'],
      message: 'Value is not valid JSON. Provide the full Google service account JSON credential string.',
    });

    return;
  }

  if (typeof parsed.private_key !== 'string' || !parsed.private_key) {
    context.addIssue({
      code: 'custom',
      path: ['GOOGLE_CREDITS'],
      message: 'JSON is missing the "private_key" field. Ensure you are using the full service account key file content.',
    });

    return;
  }

  // Normalize literal \n sequences that dotenv may leave unescaped.
  const normalizedKey = parsed.private_key.replaceAll(String.raw`\n`, '\n');

  try {
    crypto.createPrivateKey(normalizedKey);
  } catch {
    context.addIssue({
      code: 'custom',
      path: ['GOOGLE_CREDITS'],
      message:
        'The "private_key" inside GOOGLE_CREDITS is not a valid PEM private key. ' +
        'Ensure newlines are preserved (not replaced with spaces).',
    });
  }
}
