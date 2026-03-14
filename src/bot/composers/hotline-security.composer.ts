import { Composer } from 'grammy';

import { ignoreOld } from '@bot/middleware/ignore-old.middleware';

import { swindlersHelpMessage } from '@message/swindlers.message';

import type { GrammyContext } from '@app-types/context';

import { handleError } from '@utils/error-handler';

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
