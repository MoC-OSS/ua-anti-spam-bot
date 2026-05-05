import * as z from 'zod';

import { validateGoogleCredentials } from '@shared/config/validate-google-credentials';

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
 * Collects Zod issues by running validateGoogleCredentials inside a superRefine.
 * @param googleCredentials - The GOOGLE_CREDITS string to validate.
 * @returns Array of Zod issues produced by the validation.
 */
function collectIssues(googleCredentials: string): z.ZodError['issues'] {
  const validationSchema = z.object({}).superRefine((_value, context) => {
    validateGoogleCredentials(googleCredentials, context);
  });

  const result = validationSchema.safeParse({});

  return result.success ? [] : result.error.issues;
}

describe('validateGoogleCredentials', () => {
  describe('positive cases', () => {
    it('should pass with valid JSON containing a valid private_key PEM', () => {
      const credentials = JSON.stringify({ private_key: testPrivateKeyPem, client_email: 'test@example.com' });
      const issues = collectIssues(credentials);

      expect(issues).toHaveLength(0);
    });

    it('should pass when private_key contains literal backslash-n sequences', () => {
      const escapedKey = testPrivateKeyPem.replaceAll('\n', String.raw`\n`);
      const credentials = JSON.stringify({ private_key: escapedKey, client_email: 'test@example.com' });
      const issues = collectIssues(credentials);

      expect(issues).toHaveLength(0);
    });
  });

  describe('negative cases', () => {
    it('should fail when value is not valid JSON', () => {
      const issues = collectIssues('not-json');

      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain('not valid JSON');
    });

    it('should fail when JSON is missing private_key field', () => {
      const issues = collectIssues(JSON.stringify({ client_email: 'test@example.com' }));

      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain('missing the "private_key" field');
    });

    it('should fail when private_key is not a valid PEM', () => {
      const issues = collectIssues(JSON.stringify({ private_key: 'not-a-pem-key' }));

      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain('not a valid PEM private key');
    });

    it('should fail when private_key is empty string', () => {
      const issues = collectIssues(JSON.stringify({ private_key: '' }));

      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain('missing the "private_key" field');
    });
  });
});
