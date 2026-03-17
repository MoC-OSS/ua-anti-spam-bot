import type { Transformer } from 'grammy';
import { Composer } from 'grammy';

import { trainingChat } from '@bot/creator';
import type { TestTensorListener } from '@bot/listeners/test-tensor.listener';
import { onlyWithText } from '@bot/middleware/only-with-text.middleware';
import { parseText } from '@bot/middleware/parse-text.middleware';

import { messageQuery } from '@const/message-query.const';

import { environmentConfig } from '@shared/config';

import type { GrammyContext } from '@app-types/context';

/** Properties for configuring the tensor training composer. */
export interface TensorTrainingComposerProperties {
  tensorListener: TestTensorListener;
  trainingThrottler: Transformer;
}

/**
 * Composer that processes messages in the designated training chat and sends them to the tensor model listener.
 * @param root0 - Tensor training composer properties.
 * @param root0.tensorListener - Listener that processes messages for tensor model training.
 * @param root0.trainingThrottler - API transformer used to throttle training requests.
 * @returns An object containing the tensorTrainingComposer instance.
 */
export const getTensorTrainingComposer = ({ tensorListener, trainingThrottler }: TensorTrainingComposerProperties) => {
  const tensorTrainingComposer = new Composer<GrammyContext>();

  /**
   * Only these messages will be processed in this composer
   */
  const composer = tensorTrainingComposer.filter((context) => context.chat?.id === trainingChat && environmentConfig.TEST_TENSOR);

  composer.on(messageQuery, parseText, onlyWithText, tensorListener.middleware(trainingThrottler));

  return { tensorTrainingComposer };
};
