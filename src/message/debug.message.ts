import { environmentConfig } from '../config';

export interface DebugMessageProperties {
  message: string | undefined;
  byRules: Record<string, unknown>;
  startTime: Date;
}

/**
 * Returns a debug message appended to delete messages when the bot runs in debug mode.
 */
export const getDebugMessage = ({ message, byRules, startTime }: DebugMessageProperties) =>
  `
***DEBUG***
Message:
${message || 'Message is undefined'}

Ban reason:
${JSON.stringify(byRules)}

Logic type:
${environmentConfig.USE_SERVER ? 'server' : 'local'}

Last deploy:
${startTime.toString()}
`.trim();
