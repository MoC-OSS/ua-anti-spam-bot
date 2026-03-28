/**
 * @module format-errors
 * @description Formats Zod validation errors into clear, developer-friendly console output.
 * Displays all validation failures at once so developers can fix everything in one pass.
 */

import type * as z from 'zod';

/**
 * Formats a Zod error into a human-readable multi-line string.
 * Each issue is displayed on its own line with the variable name and error message.
 * @param error - The Zod error object from a failed `.parse()` call.
 * @returns A formatted string listing all validation failures.
 */
export function formatEnvironmentErrors(error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const path = issue.path.join('.');

    return `  - ${path}: ${issue.message}`;
  });

  return ['', 'Environment configuration errors:', '', ...lines, ''].join('\n');
}
