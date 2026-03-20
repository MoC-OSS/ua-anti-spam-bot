import { environmentConfig } from '@shared/config';

export interface DebugMessageProperties {
  message: string | undefined;
  byRules: Record<string, unknown>;
  startTime: Date;
}

/**
 * Returns a debug message appended to delete messages when the bot runs in debug mode.
 * @param root0 - Debug message properties.
 * @param root0.message - The original user message text.
 * @param root0.byRules - An object describing which rules triggered the deletion.
 * @param root0.startTime - The bot start time (last deploy timestamp).
 * @returns The formatted debug message string.
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
