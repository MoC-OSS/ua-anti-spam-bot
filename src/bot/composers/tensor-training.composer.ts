import type { Transformer } from 'grammy';
import { Composer } from 'grammy';

import type { TestTensorListener } from '@bot/listeners';
import { onlyWithText, parseText } from '@bot/middleware';

import { messageQuery } from '@const/';

import type { GrammyContext } from '@types/';

import { environmentConfig } from '../../config';
import { trainingChat } from '../../creator';

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
