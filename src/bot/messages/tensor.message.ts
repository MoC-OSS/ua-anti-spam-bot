import type { GrammyContext } from '@app-types/context';

export interface TensorTestResultProperties {
  chance: string;
  isSpam: boolean;
}

/**
 * Returns the result of a tensor spam-detection test with chance and verdict.
 * @param context - Grammy bot context.
 * @param root0 - Tensor test result properties.
 * @param root0.chance - The spam probability percentage as a string.
 * @param root0.isSpam - Whether the tensor model classified the message as spam.
 * @returns The formatted tensor test result message string.
 */
export const getTensorTestResult = (context: GrammyContext, { chance, isSpam }: TensorTestResultProperties) =>
  [
    context.t('tensor-test-spam-chance', { chance }),
    isSpam ? context.t('tensor-test-verdict-spam') : context.t('tensor-test-verdict-not-spam'),
  ].join('\n');
