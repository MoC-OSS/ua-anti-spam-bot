import * as z from 'zod';

import { formatEnvironmentErrors } from '@shared/config/format-errors';

describe('formatEnvironmentErrors', () => {
  describe('positive cases', () => {
    it('should format a single issue', () => {
      const testSchema = z.object({ FOO: z.string().trim() });
      const result = testSchema.safeParse({});

      expect(result.success).toBe(false);

      const output = formatEnvironmentErrors((result as { success: false; error: z.ZodError }).error);

      expect(output).toContain('Environment configuration errors:');
      expect(output).toContain('FOO');
    });

    it('should format multiple issues', () => {
      const testSchema = z.object({ FOO: z.string().trim(), BAR: z.number() });
      const result = testSchema.safeParse({});

      expect(result.success).toBe(false);

      const output = formatEnvironmentErrors((result as { success: false; error: z.ZodError }).error);

      expect(output).toContain('FOO');
      expect(output).toContain('BAR');
    });
  });
});
