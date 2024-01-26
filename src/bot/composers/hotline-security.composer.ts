import { Composer } from 'grammy';

import { swindlersHelpMessage } from '../../message';
import type { GrammyContext } from '../../types';
import { handleError } from '../../utils';
import { ignoreOld } from '../middleware';

/**
 * @description Health-check helper composer
 * */
export const getHotlineSecurityComposer = () => {
  const hotlineSecurityComposer = new Composer<GrammyContext>();

  hotlineSecurityComposer.command('hotline_security', ignoreOld(30), async (context) => {
    await context.deleteMessage().catch(handleError);
    await context.replyWithSelfDestructedHTML(swindlersHelpMessage);
  });

  return { hotlineSecurityComposer };
};
