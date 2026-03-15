import type { Transformer } from 'grammy';
import { Composer } from 'grammy';

import type { TestTensorListener } from '@bot/listeners/test-tensor.listener';
import { onlyWithText } from '@bot/middleware/only-with-text.middleware';
import { parseText } from '@bot/middleware/parse-text.middleware';

import { messageQuery } from '@const/message-query.const';

import type { GrammyContext } from '@app-types/context';

import { environmentConfig } from '../../config';
import { trainingChat } from '../../creator';

/** Properties for configuring the tensor training composer. */
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

  composer.on(messageQuery, parseText, onlyWithText, tensorListener.middleware(trainingThrottler));

  return { tensorTrainingComposer };
};
