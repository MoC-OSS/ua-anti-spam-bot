import { Composer } from 'grammy';

import type { OnTextListener } from '@bot/listeners/on-text.listener';

import type { GrammyContext } from '@app-types/context';

/** Properties for the strategic information filter composer. */
export interface StrategicComposerProperties {
  onTextListener: OnTextListener;
}

/**
 * Returns a composer that detects and removes messages containing strategic military information.
 * @param root0 - Composer properties.
 * @param root0.onTextListener - Listener that handles text-based strategic content detection.
 * @returns Object containing the strategic composer instance.
 */
export const getStrategicComposer = ({ onTextListener }: StrategicComposerProperties) => {
  const strategicComposer = new Composer<GrammyContext>();

  strategicComposer.use(onTextListener.middleware());

  return { strategicComposer };
};
