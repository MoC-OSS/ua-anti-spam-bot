import { Composer } from 'grammy';

import type { OnTextListener } from '@bot/listeners/on-text.listener';

import type { GrammyContext } from '@app-types/context';

/** Properties for the strategic information filter composer. */
export interface StrategicComposerProperties {
  onTextListener: OnTextListener;
}

/**
 * @param root0
 * @param root0.onTextListener
 * @description Remove strategic information logic
 */
export const getStrategicComposer = ({ onTextListener }: StrategicComposerProperties) => {
  const strategicComposer = new Composer<GrammyContext>();

  strategicComposer.use(onTextListener.middleware());

  return { strategicComposer };
};
