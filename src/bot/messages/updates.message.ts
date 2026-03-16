import type { GrammyContext } from '@app-types/context';

/**
 * Returns the prompt message asking what the user wants to send to all private chats.
 * @param context
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
 * @param context
 * @param root0
 * @param root0.totalCount
 * @param root0.finishedCount
 * @param root0.successCount
 * @param root0.type
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
 * @param context
 * @param root0
 * @param root0.totalCount
 * @param root0.successCount
 */
export const getSuccessfulMessage = (context: GrammyContext, { totalCount, successCount }: SuccessfulMessageProperties) =>
  [context.t('updates-done'), context.t('updates-done-count', { total: totalCount, success: successCount })].join('\n');
