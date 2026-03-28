import { environmentSchema } from '@shared/config/env.schema';

describe('environmentSchema', () => {
  describe('positive cases', () => {
    it('should parse empty env with defaults', () => {
      const result = environmentSchema.parse({});

      expect(result.ENV).toBe('develop');
      expect(result.DEBUG).toBe(false);
      expect(result.TENSOR_RANK).toBe(0.9);
      expect(result.PORT).toBe(3000);
      expect(result.BOT_PORT).toBe(3010);
      expect(result.HOST).toBe('localhost');
      expect(result.REDIS_URL).toBe('redis://localhost:6379');
    });

    it('should coerce string booleans', () => {
      const result = environmentSchema.parse({ DEBUG: 'true', DISABLE_GOOGLE_API: '1', USE_SERVER: 'false' });

      expect(result.DEBUG).toBe(true);
      expect(result.DISABLE_GOOGLE_API).toBe(true);
      expect(result.USE_SERVER).toBe(false);
    });

    it('should coerce string numbers', () => {
      const result = environmentSchema.parse({ PORT: '8080', TENSOR_RANK: '0.85' });

      expect(result.PORT).toBe(8080);
      expect(result.TENSOR_RANK).toBe(0.85);
    });

    it('should parse ENV enum values', () => {
      expect(environmentSchema.parse({ ENV: 'local' }).ENV).toBe('local');
      expect(environmentSchema.parse({ ENV: 'develop' }).ENV).toBe('develop');
      expect(environmentSchema.parse({ ENV: 'production' }).ENV).toBe('production');
    });

    it('should trim string values', () => {
      const result = environmentSchema.parse({ BOT_TOKEN: '  my-token  ', HOST: '  0.0.0.0  ' });

      expect(result.BOT_TOKEN).toBe('my-token');
      expect(result.HOST).toBe('0.0.0.0');
    });

    it('should parse CREATOR_ID as optional number', () => {
      const withId = environmentSchema.parse({ CREATOR_ID: '12345' });

      expect(withId.CREATOR_ID).toBe(12_345);

      const withoutId = environmentSchema.parse({});

      expect(withoutId.CREATOR_ID).toBeUndefined();
    });
  });

  describe('negative cases', () => {
    it('should reject invalid ENV values', () => {
      const result = environmentSchema.safeParse({ ENV: 'staging' });

      expect(result.success).toBe(false);
    });
  });
});
