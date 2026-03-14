import { Composer } from 'grammy';

import { ignoreOld } from '@bot/middleware';

import { swindlersHelpMessage } from '@message/';

import type { GrammyContext } from '@types/';

import { handleError } from '@utils/';

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
