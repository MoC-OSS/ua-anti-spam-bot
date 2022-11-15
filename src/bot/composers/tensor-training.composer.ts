import type { Transformer } from 'grammy';
import { Composer } from 'grammy';

import { environmentConfig } from '../../config';
import { trainingChat } from '../../creator';
import type { GrammyContext } from '../../types';
import type { TestTensorListener } from '../listeners';

export interface TensorTrainingComposerProperties {
  tensorListener: TestTensorListener;
  trainingThrottler: Transformer;
}

/**
 * @description Message handling composer
 * */
export const getTensorTrainingComposer = ({ tensorListener, trainingThrottler }: TensorTrainingComposerProperties) => {
  const tensorTrainingComposer = new Composer<GrammyContext>();

  /**
   * Only these messages will be processed in this composer
   * */
  const composer = tensorTrainingComposer.filter((context) => context.chat?.id === trainingChat && environmentConfig.TEST_TENSOR);

  composer.on(['message:text', 'edited_message:text', 'message:poll'], tensorListener.middleware(trainingThrottler));

  return { tensorTrainingComposer };
};
