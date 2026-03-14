import { Composer } from 'grammy';

import type { OnTextListener } from '@bot/listeners/on-text.listener';

import type { GrammyContext } from '@app-types/context';

export interface StrategicComposerProperties {
  onTextListener: OnTextListener;
}

/**
 * @description Remove strategic information logic
 * */
export const getStrategicComposer = ({ onTextListener }: StrategicComposerProperties) => {
  const strategicComposer = new Composer<GrammyContext>();

  strategicComposer.use(onTextListener.middleware());

  return { strategicComposer };
};
