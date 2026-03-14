export interface GrammyEnvironmentConfig {
  readonly BOT_TOKEN: string;
  readonly CREATOR_ID?: string | null;
  readonly USERS_WHITELIST: string;
  readonly USERS_FOR_SWINDLERS_STATISTIC_WHITELIST: string;
}

export interface ServerEnvironmentConfig {
  readonly PORT: number;
  readonly HOST: string;
  readonly BOT_PORT: number;
  readonly BOT_HOST: string;
  readonly USE_SERVER: boolean;
  readonly FRONTEND_HOST: string;
  readonly WEB_VIEW_URL: string;
}

export interface MiscellaneousEnvironmentConfig {
  readonly ENV: 'develop' | 'local' | 'production';
  readonly UNIT_TESTING?: boolean;
  readonly TEST_TENSOR: boolean; // deprecated
  readonly TENSOR_RANK: number;
  readonly REDIS_URL: string;
  readonly DEBUG: boolean;
  readonly DEBUG_MIDDLEWARE: boolean;
  readonly DISABLE_LOGS_CHAT: boolean;
  readonly ALARM_KEY: string;
  readonly DISABLE_ALARM_API: boolean;
}

export interface UserbotEnvironmentConfig {
  readonly USERBOT_APP_ID: string;
  readonly USERBOT_API_HASH: string;
  readonly USERBOT_LOGIN_PHONE: string;
  readonly USERBOT_LOGIN_CODE: string;
  readonly USERBOT_TRAING_CHAT_NAME: string;
}

export interface PostgresEnvironmentConfig {
  readonly POSTGRES_PASSWORD: string;
  readonly PGHOST: string;
  readonly PGUSER: string;
  readonly PGDATABASE: string;
  readonly PGPORT: string;
}

export interface GoogleEnvironmentConfig {
  readonly DISABLE_GOOGLE_API: boolean;
  readonly GOOGLE_CREDITS: string;
  readonly GOOGLE_SPREADSHEET_ID: string;
}

export interface AwsEnvironmentConfig {
  readonly S3_BUCKET?: string | null;
  readonly S3_PATH: string;
  readonly AWS_REGION: string;
}

export type EnvironmentConfig = GrammyEnvironmentConfig &
  ServerEnvironmentConfig &
  MiscellaneousEnvironmentConfig &
  UserbotEnvironmentConfig &
  PostgresEnvironmentConfig &
  GoogleEnvironmentConfig &
  AwsEnvironmentConfig;
