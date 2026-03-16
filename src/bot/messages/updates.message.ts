import type { GrammyContext } from '@app-types/context';

/**
 * Returns the prompt message asking what the user wants to send to all private chats.
 * @param context - Grammy bot context.
 * @returns The localized updates prompt string.
 */
export const getUpdatesMessage = (context: GrammyContext) => context.t('updates-prompt');

export interface UpdateMessageProperties {
  totalCount: number;
  finishedCount: number;
  successCount: number;
  type: string;
}

/**
 * Returns a progress message for the updates broadcast operation.
 * @param context - Grammy bot context.
 * @param root0 - Update message properties.
 * @param root0.totalCount - Total number of sessions being messaged.
 * @param root0.finishedCount - Number of sessions already processed.
 * @param root0.successCount - Number of successfully delivered messages.
 * @param root0.type - The chat type being updated (e.g. 'private' or 'supergroup').
 * @returns The formatted broadcast progress message string.
 */
export const getUpdateMessage = (context: GrammyContext, { totalCount, finishedCount, successCount, type }: UpdateMessageProperties) =>
  [
    context.t('updates-progress', { total: totalCount, finished: finishedCount, type }),
    context.t('updates-progress-success', { success: successCount }),
  ].join('\n');

export interface SuccessfulMessageProperties {
  totalCount: number;
  successCount: number;
}

/**
 * Returns the final success message after the updates broadcast completes.
 * @param context - Grammy bot context.
 * @param root0 - Successful message properties.
 * @param root0.totalCount - Total number of sessions targeted.
 * @param root0.successCount - Number of sessions that received the message successfully.
 * @returns The formatted broadcast completion message string.
 */
export const getSuccessfulMessage = (context: GrammyContext, { totalCount, successCount }: SuccessfulMessageProperties) =>
  [context.t('updates-done'), context.t('updates-done-count', { total: totalCount, success: successCount })].join('\n');
