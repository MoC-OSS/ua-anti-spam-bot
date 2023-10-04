import { Composer } from 'grammy';

import { swindlersHelpMessage } from '../../message';
import type { GrammyContext } from '../../types';
import { handleError } from '../../utils';
import { ignoreOld } from '../middleware';

const mainPhotoFileId = 'AgACAgIAAxkBAAI3PGUdLT60yhtl3GLyAgXYSZ1IjO2NAALSzTEbKALoSCJ7nmsSxICQAQADAgADeAADMAQ';

/**
 * @description Health-check helper composer
 * */
export const getHotlineSecurityComposer = () => {
  const hotlineSecurityComposer = new Composer<GrammyContext>();

  hotlineSecurityComposer.command('hotline_security', ignoreOld(30), async (context) => {
    await context.deleteMessage().catch(handleError);
    await context.replyWithPhotoWithSelfDestructedHTML(mainPhotoFileId, { caption: swindlersHelpMessage });
  });

  return { hotlineSecurityComposer };
};
