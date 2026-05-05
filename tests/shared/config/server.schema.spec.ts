import * as z from 'zod';

import type { EnvironmentConfig } from '@shared/config/env.schema';
import { environmentSchema } from '@shared/config/env.schema';
import { validateServerEnvironment } from '@shared/config/server.schema';

const { testPrivateKeyPem } = vi.hoisted(() => {
  type GenerateKeyPairSyncFunction = (
    type: 'rsa',
    options: { modulusLength: number; publicKeyEncoding: object; privateKeyEncoding: object },
  ) => { privateKey: string; publicKey: string };

  // eslint-disable-next-line global-require
  const { generateKeyPairSync } = require('node:crypto') as { generateKeyPairSync: GenerateKeyPairSyncFunction };

  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return { testPrivateKeyPem: privateKey };
});

/**
 * Creates a test config with defaults for disabled integrations.
 * @param overrides - Env var overrides to merge into the defaults.
 */
function makeConfig(overrides: Partial<Record<string, unknown>> = {}): EnvironmentConfig {
  return environmentSchema.parse({
    BOT_TOKEN: 'test-token',
    DISABLE_GOOGLE_API: 'true',
    DISABLE_ALARM_API: 'true',
    ...overrides,
  });
}

/** Valid GOOGLE_CREDENTIALS JSON string with a real PEM private key. */
const validGoogleCredentials = JSON.stringify({ private_key: testPrivateKeyPem, client_email: 'test@example.com' });

describe('validateServerEnvironment', () => {
  describe('positive cases', () => {
    it('should pass when all required vars are set and integrations are disabled', () => {
      const config = makeConfig();

      expect(() => validateServerEnvironment(config)).not.toThrow();
    });

    it('should pass when Google API is enabled with valid credentials', () => {
      const config = makeConfig({
        DISABLE_GOOGLE_API: 'false',
        GOOGLE_CREDITS: validGoogleCredentials,
        GOOGLE_SPREADSHEET_ID: 'abc123',
      });

      expect(() => validateServerEnvironment(config)).not.toThrow();
    });

    it('should pass when Alarm API is enabled with valid key', () => {
      const config = makeConfig({
        DISABLE_ALARM_API: 'false',
        ALARM_KEY: 'test-alarm-key',
      });

      expect(() => validateServerEnvironment(config)).not.toThrow();
    });
  });

  describe('negative cases', () => {
    it('should fail when BOT_TOKEN is missing', () => {
      const config = makeConfig({ BOT_TOKEN: '' });

      expect(() => validateServerEnvironment(config)).toThrow(z.ZodError);
    });

    it('should fail when Alarm API is enabled but ALARM_KEY is missing', () => {
      const config = makeConfig({ DISABLE_ALARM_API: 'false', ALARM_KEY: '' });

      expect(() => validateServerEnvironment(config)).toThrow(z.ZodError);
    });

    it('should fail when ALARM_WEBHOOK_PUBLIC_KEY_PEM is invalid PEM', () => {
      const config = makeConfig({
        DISABLE_ALARM_API: 'false',
        ALARM_KEY: 'test-key',
        ALARM_WEBHOOK_PUBLIC_KEY_PEM: 'not-a-valid-pem-key',
      });

      expect(() => validateServerEnvironment(config)).toThrow(z.ZodError);
    });

    it('should fail when GOOGLE_CREDITS contains invalid JSON', () => {
      const config = makeConfig({ DISABLE_GOOGLE_API: 'false', GOOGLE_CREDITS: 'not-json', GOOGLE_SPREADSHEET_ID: 'abc' });

      expect(() => validateServerEnvironment(config)).toThrow(z.ZodError);
    });

    it('should fail when GOOGLE_CREDITS has invalid private_key PEM', () => {
      const config = makeConfig({
        DISABLE_GOOGLE_API: 'false',
        GOOGLE_CREDITS: JSON.stringify({ private_key: 'bad-key' }),
        GOOGLE_SPREADSHEET_ID: 'abc',
      });

      expect(() => validateServerEnvironment(config)).toThrow(z.ZodError);
    });

    it('should report all issues at once', () => {
      const config = makeConfig({
        BOT_TOKEN: '',
        DISABLE_GOOGLE_API: 'false',
        GOOGLE_CREDITS: '',
        GOOGLE_SPREADSHEET_ID: '',
        DISABLE_ALARM_API: 'false',
        ALARM_KEY: '',
      });

      let caughtError: z.ZodError | undefined;

      try {
        validateServerEnvironment(config);
      } catch (error) {
        caughtError = error as z.ZodError;
      }

      expect(caughtError).toBeInstanceOf(z.ZodError);
      expect(caughtError!.issues.length).toBeGreaterThanOrEqual(4);
    });
  });
});
