import type { GrammyContext } from '@app-types/context';

export interface TensorTestResultProperties {
  chance: string;
  isSpam: boolean;
}

/**
 * Returns the result of a tensor spam-detection test with chance and verdict.
 * @param context
 * @param root0
 * @param root0.chance
 * @param root0.isSpam
 */
export const getTensorTestResult = (context: GrammyContext, { chance, isSpam }: TensorTestResultProperties) =>
  [
    context.t('tensor-test-spam-chance', { chance }),
    isSpam ? context.t('tensor-test-verdict-spam') : context.t('tensor-test-verdict-not-spam'),
  ].join('\n');
