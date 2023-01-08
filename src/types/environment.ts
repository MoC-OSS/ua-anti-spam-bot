export interface GrammyEnvironmentConfig {
  BOT_TOKEN: string;
  CHAT_WHITELIST?: number[] | null; // deprecated
  CREATOR_ID?: string | null;
  ONLY_WORK_IN_COMMENTS: boolean; // deprecated
  USERS_WHITELIST: string;
}

export interface ServerEnvironmentConfig {
  PORT: number;
  HOST: string;
  BOT_PORT: number;
  BOT_HOST: string;
  USE_SERVER: boolean;
}

export interface MiscellaneousEnvironmentConfig {
  ENV: 'local' | 'develop' | 'production';
  UNIT_TESTING?: boolean;
  TEST_TENSOR: boolean;
  TENSOR_RANK: number;
  REDIS_URL: string;
  ONLY_WORK_IN_COMMENTS: boolean; // deprecated
  DEBUG: boolean;
  DEBUG_MIDDLEWARE: boolean;
  ALARM_KEY: string;
}

export interface UserbotEnvironmentConfig {
  USERBOT_APP_ID: string;
  USERBOT_API_HASH: string;
  USERBOT_LOGIN_PHONE: string;
  USERBOT_LOGIN_CODE: string;
  USERBOT_TRAING_CHAT_NAME: string;
}

export interface PostgresEnvironmentConfig {
  POSTGRES_PASSWORD: string;
  PGHOST: string;
  PGUSER: string;
  PGDATABASE: string;
  PGPORT: string;
}

export interface SpamReputationEnvironmentConfig {
  DISABLE_USER_REP: boolean;
  START_REPUTATION: number;
  CHANNEL_START_REPUTATION: number;
  EMOJI_REPUTATION: number;
  FORMATTINGS_REPUTATION: number;
  URLS_REPUTATION: number;
  NEW_MESSAGE_REPUTATION: number;
  START_MSG_REPUTATION: number;
  FORMATTINGS_MSG_REPUTATION: number;
  EMOJI_MSG_REPUTATION: number;
  URLS_MSG_REPUTATION: number;
  CHANNEL_MSG_REPUTATION: number;
}

export interface GoogleEnvironmentConfig {
  GOOGLE_CREDITS: string;
  GOOGLE_SPREADSHEET_ID: string;
  GOOGLE_POSITIVE_SHEET_NAME: string;
  GOOGLE_NEGATIVE_SHEET_NAME: string;
  GOOGLE_SWINDLERS_SHEET_NAME: string;
}

export interface AwsEnvironmentConfig {
  S3_BUCKET?: string | null;
  S3_PATH: string;
  AWS_REGION: string;
}

export interface RabbitMQEnvironmentConfig {
  RABBITMQ_USER: string;
  RABBITMQ_PASS: string;
}

export type EnvironmentConfig = GrammyEnvironmentConfig &
  ServerEnvironmentConfig &
  MiscellaneousEnvironmentConfig &
  UserbotEnvironmentConfig &
  PostgresEnvironmentConfig &
  SpamReputationEnvironmentConfig &
  GoogleEnvironmentConfig &
  AwsEnvironmentConfig &
  RabbitMQEnvironmentConfig;
