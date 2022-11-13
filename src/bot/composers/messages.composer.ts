import type { Transformer } from 'grammy';
import { Composer } from 'grammy';

import type { GrammyContext } from '../../types';
import { wrapperErrorHandler } from '../../utils';
import type { OnTextListener, TestTensorListener } from '../listeners';
import type { DeleteSwindlersMiddleware } from '../middleware';
import {
  botActiveMiddleware,
  botRedisActive,
  ignoreBySettingsMiddleware,
  ignoreOld,
  nestedMiddleware,
  onlyNotAdmin,
  onlyNotForwarded,
  onlyWhenBotAdmin,
  onlyWithText,
  performanceEndMiddleware,
  performanceStartMiddleware,
} from '../middleware';

export interface MessagesComposerProperties {
  tensorListener: TestTensorListener;
  trainingThrottler: Transformer;
  deleteSwindlersMiddleware: DeleteSwindlersMiddleware;
  onTextListener: OnTextListener;
}

/**
 * @description Message handling composer
 * */
export const getMessagesComposer = ({
  deleteSwindlersMiddleware,
  onTextListener,
  tensorListener,
  trainingThrottler,
}: MessagesComposerProperties) => {
  const messagesComposer = new Composer<GrammyContext>();

  messagesComposer.on(
    ['message:text', 'edited_message:text', 'message:poll'],
    botRedisActive,
    ignoreOld(60),
    botActiveMiddleware,
    wrapperErrorHandler(tensorListener.middleware(trainingThrottler)),
    onlyNotAdmin,
    onlyNotForwarded,
    onlyWithText,
    onlyWhenBotAdmin,
    nestedMiddleware(ignoreBySettingsMiddleware('disableSwindlerMessage'), deleteSwindlersMiddleware.middleware()),
    nestedMiddleware(
      ignoreBySettingsMiddleware('disableStrategicInfo'),
      wrapperErrorHandler(performanceStartMiddleware),
      wrapperErrorHandler(onTextListener.middleware()),
      wrapperErrorHandler(performanceEndMiddleware),
    ),
  );

  return { messagesComposer };
};
