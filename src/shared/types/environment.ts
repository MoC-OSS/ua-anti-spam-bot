/**
 * @module environment
 * @description Environment config type definition.
 * The canonical Zod schema is in `@shared/config/env.schema.ts`.
 * Import from there for the full schema; this file provides the type only.
 * @deprecated Import `EnvironmentConfig` from `@shared/config/env.schema` instead.
 */

import type * as z from 'zod';

import type { environmentSchema } from '@shared/config/env.schema';

/** TypeScript type representing the fully parsed environment configuration. */
export type EnvironmentConfig = z.infer<typeof environmentSchema>;
