import { Composer } from 'grammy';

import type { GrammyContext } from '../../../types';
import type { OnTextListener } from '../../listeners';

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
