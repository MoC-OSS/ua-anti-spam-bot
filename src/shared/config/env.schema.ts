/**
 * @module env.schema
 * @description Zod schemas for environment variables, grouped by domain.
 *
 * All variables are parsed with sensible defaults so the combined schema never
 * rejects on missing optional values. Process-specific required-field checks
 * live in `bot.schema.ts` and `server.schema.ts`.
 *
 * ## How to add a new env variable
 * 1. Add the field to the appropriate domain object below.
 * 2. If it is required for bot or server, add a conditional check in the
 *    matching `superRefine` block in `bot.schema.ts` or `server.schema.ts`.
 * 3. Add the variable to `.env.template` with documentation.
 */

import * as z from 'zod';

/** Coerces common truthy env strings (`"true"`, `"1"`, `"yes"`) to boolean. */
const booleanStringSchema = z.union([z.boolean(), z.string().trim()]).transform((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  return ['true', '1', 'yes'].includes(value.toLowerCase());
});

// ---------------------------------------------------------------------------
// Domain schemas
// ---------------------------------------------------------------------------

/** Variables shared by both bot and server processes. */
const sharedSchema = z.object({
  ENV: z.enum(['local', 'develop', 'production']).default('develop'),
  UNIT_TESTING: booleanStringSchema.default(false),
  DEBUG: booleanStringSchema.default(false),
  DEBUG_MIDDLEWARE: booleanStringSchema.default(false),
  TENSOR_RANK: z.coerce.number().default(0.9),
  // Note: TEST_TENSOR is legacy — kept for backward compatibility.
  TEST_TENSOR: booleanStringSchema.default(false),
});

/** Bot-process variables (Grammy, Telegram, sessions). */
const botVariablesSchema = z.object({
  BOT_TOKEN: z.string().trim().default(''),
  BOT_PORT: z.coerce.number().default(3010),
  BOT_HOST: z.string().trim().default('localhost'),
  REDIS_URL: z.string().trim().default('redis://localhost:6379'),
  CREATOR_ID: z.coerce.number().optional(),
  USERS_WHITELIST: z.string().trim().default(''),
  USERS_FOR_SWINDLERS_STATISTIC_WHITELIST: z.string().trim().default(''),
  FRONTEND_HOST: z.string().trim().default(''),
  WEB_VIEW_URL: z.string().trim().default(''),
  DISABLE_LOGS_CHAT: booleanStringSchema.default(false),
});

/** Express server variables. */
const serverVariablesSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().trim().default('localhost'),
  USE_SERVER: booleanStringSchema.default(true),
});

/** Alarm / air-raid API variables. Conditional on DISABLE_ALARM_API. */
const alarmVariablesSchema = z.object({
  DISABLE_ALARM_API: booleanStringSchema.default(false),
  ALARM_KEY: z.string().trim().default(''),
  ALARM_WEBHOOK_BASE_URL: z.string().trim().default(''),
  ALARM_WEBHOOK_PUBLIC_KEY_PEM: z.string().trim().default(''),
});

/** Google Sheets API variables. Conditional on DISABLE_GOOGLE_API. */
const googleVariablesSchema = z.object({
  DISABLE_GOOGLE_API: booleanStringSchema.default(false),
  GOOGLE_CREDITS: z.string().trim().default(''),
  GOOGLE_SPREADSHEET_ID: z.string().trim().default(''),
});

/** AWS S3 variables. */
const awsVariablesSchema = z.object({
  S3_BUCKET: z.string().trim().default(''),
  S3_PATH: z.string().trim().default(''),
  AWS_REGION: z.string().trim().default(''),
});

/** PostgreSQL variables — legacy, kept only for backward compat. */
const postgresVariablesSchema = z.object({
  POSTGRES_PASSWORD: z.string().trim().default('secret'),
  PGHOST: z.string().trim().default('postgres'),
  PGUSER: z.string().trim().default('postgres'),
  PGDATABASE: z.string().trim().default('postgres'),
  PGPORT: z.string().trim().default('5432'),
});

/** Userbot (MTProto) variables. Only needed for the research userbot process. */
const userbotVariablesSchema = z.object({
  USERBOT_APP_ID: z.string().trim().default(''),
  USERBOT_API_HASH: z.string().trim().default(''),
  USERBOT_LOGIN_PHONE: z.string().trim().default(''),
  USERBOT_LOGIN_CODE: z.string().trim().default(''),
  USERBOT_TRAING_CHAT_NAME: z.string().trim().default(''),
});

// ---------------------------------------------------------------------------
// Combined schema
// ---------------------------------------------------------------------------

/**
 * The full environment schema that merges all domain schemas.
 * Parsing with this schema coerces types and applies defaults but does NOT
 * enforce process-specific required-field rules — those live in
 * `bot.schema.ts` and `server.schema.ts`.
 */
export const environmentSchema = z.object({
  ...sharedSchema.shape,
  ...botVariablesSchema.shape,
  ...serverVariablesSchema.shape,
  ...alarmVariablesSchema.shape,
  ...googleVariablesSchema.shape,
  ...awsVariablesSchema.shape,
  ...postgresVariablesSchema.shape,
  ...userbotVariablesSchema.shape,
});

/** TypeScript type inferred from the full environment schema. */
export type EnvironmentConfig = z.infer<typeof environmentSchema>;
