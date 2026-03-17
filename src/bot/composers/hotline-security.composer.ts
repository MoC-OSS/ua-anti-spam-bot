import { Composer } from 'grammy';

import { ignoreOld } from '@bot/middleware/ignore-old.middleware';

import { getSwindlersHelpMessage } from '@message/swindlers.message';

import type { GrammyContext } from '@app-types/context';

import { handleError } from '@utils/error-handler.util';

/**
 * Composer that handles the hotline security command, replying with anti-swindler help information.
 * @returns An object containing the hotlineSecurityComposer instance.
 */
export const getHotlineSecurityComposer = () => {
  const hotlineSecurityComposer = new Composer<GrammyContext>();

  hotlineSecurityComposer.command('hotline_security', ignoreOld(30), async (context) => {
    await context.deleteMessage().catch(handleError);
    await context.replyWithSelfDestructedHTML(getSwindlersHelpMessage(context));
  });

  return { hotlineSecurityComposer };
};
